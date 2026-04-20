from datetime import date, datetime
from typing import List
from pydantic import BaseModel, EmailStr
from app.models import UserRole
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, get_current_farm, require_active_subscription
from app.models import (
    FeedInventory,
    FeedIngredient,
    FeedMix,
    FeedMixItem,
    Notification,
    User,
    Farm,
)
from app.schemas import (
    FeedInventoryResponse,
    FeedInventoryUpdate,
    FeedIngredientCreate,
    FeedIngredientResponse,
    FeedMixCreate,
    FeedMixItemResponse,
    FeedMixResponse,
)

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/inventory", response_model=FeedInventoryResponse)
async def get_inventory(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    result = await db.execute(
        select(FeedInventory)
        .where(FeedInventory.farm_id == farm.id)
        .order_by(FeedInventory.id.desc())
        .limit(1)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        inv = FeedInventory(
            farm_id=farm.id,
            feed_type="General",
            opening_stock=0.0,
            received=0.0,
            consumed=0.0,
            closing_stock=0.0,
        )
        db.add(inv)
        await db.commit()
        await db.refresh(inv)
    return inv


@router.post("/inventory", response_model=FeedInventoryResponse)
async def update_inventory(
    data: FeedInventoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    closing_stock = data.opening_stock + data.received - data.consumed
    inv = FeedInventory(
        farm_id=farm.id,
        feed_type=data.feed_type,
        opening_stock=data.opening_stock,
        received=data.received,
        consumed=data.consumed,
        closing_stock=closing_stock,
    )
    db.add(inv)
    db.add(
        Notification(
            user_id=current_user.id,
            farm_id=farm.id,
            message="Feed inventory updated",
        )
    )
    await db.commit()
    await db.refresh(inv)
    return inv


@router.get("/ingredients", response_model=List[FeedIngredientResponse])
async def get_ingredients(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    result = await db.execute(
        select(FeedIngredient).where(FeedIngredient.farm_id == farm.id)
    )
    return result.scalars().all()


@router.post("/ingredients", response_model=FeedIngredientResponse)
async def create_ingredient(
    data: FeedIngredientCreate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    ingredient = FeedIngredient(**data.model_dump(), farm_id=farm.id)
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    return ingredient


@router.put("/ingredients/{ingredient_id}", response_model=FeedIngredientResponse)
async def update_ingredient(
    ingredient_id: int,
    data: FeedIngredientCreate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    result = await db.execute(
        select(FeedIngredient)
        .where(FeedIngredient.id == ingredient_id, FeedIngredient.farm_id == farm.id)
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for key, value in data.model_dump().items():
        setattr(ingredient, key, value)
    await db.commit()
    await db.refresh(ingredient)
    return ingredient


@router.delete("/ingredients/{ingredient_id}")
async def delete_ingredient(
    ingredient_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    result = await db.execute(
        select(FeedIngredient)
        .where(FeedIngredient.id == ingredient_id, FeedIngredient.farm_id == farm.id)
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    await db.delete(ingredient)
    await db.commit()
    return {"detail": "Ingredient deleted"}


@router.get("/mixes", response_model=List[FeedMixResponse])
async def get_mixes(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    result = await db.execute(
        select(FeedMix)
        .where(FeedMix.farm_id == farm.id)
        .options(
            selectinload(FeedMix.mix_items).selectinload(FeedMixItem.ingredient)
        )
        .order_by(FeedMix.mix_date.desc())
    )
    return result.scalars().all()


@router.post("/mixes", response_model=FeedMixResponse)
async def create_mix(
    data: FeedMixCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    ingredient_ids = [item.ingredient_id for item in data.items]
    ingredients_result = await db.execute(
        select(FeedIngredient)
        .where(
            FeedIngredient.id.in_(ingredient_ids),
            FeedIngredient.farm_id == farm.id,
        )
    )
    ingredients = {ing.id: ing for ing in ingredients_result.scalars().all()}
    if len(ingredients) != len(ingredient_ids):
        raise HTTPException(status_code=400, detail="Invalid ingredient selected")

    total_kg = sum(item.quantity_kg for item in data.items)
    total_cost = sum(
        item.quantity_kg * ingredients[item.ingredient_id].unit_cost
        for item in data.items
    )
    cost_per_kg = total_cost / total_kg if total_kg else 0.0

    mix = FeedMix(
        farm_id=farm.id,
        name=data.name,
        mix_date=datetime.combine(data.mix_date, datetime.min.time()),
        total_kg=total_kg,
        cost_per_kg=cost_per_kg,
        created_by=current_user.id,
    )
    db.add(mix)
    await db.commit()
    await db.refresh(mix)

    for item in data.items:
        db.add(
            FeedMixItem(
                mix_id=mix.id,
                ingredient_id=item.ingredient_id,
                quantity_kg=item.quantity_kg,
            )
        )

    await db.commit()
    await db.refresh(mix)
    return mix