from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Farm, Notification, TrayInventory, TraySale, User
from app.schemas import TrayInventoryResponse, TrayInventoryUpdate, TraySaleCreate, TraySaleResponse
from app.dependencies import get_current_farm, get_current_user, require_active_subscription

router = APIRouter(prefix="/trays", tags=["trays"])

@router.get("/inventory", response_model=TrayInventoryResponse)
async def get_inventory(db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    result = await db.execute(select(TrayInventory).where(TrayInventory.farm_id == farm.id).order_by(TrayInventory.date.desc()).limit(1))
    inv = result.scalar_one_or_none()
    return inv or TrayInventory(id=0, opening_stock=0, received=0, sold=0, closing_stock=0)

@router.get("/sales", response_model=List[TraySaleResponse])
async def get_sales(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    result = await db.execute(
        select(TraySale).where(TraySale.farm_id == farm.id).order_by(TraySale.sale_date.desc())
    )
    return result.scalars().all()


@router.post("/sales", response_model=TraySaleResponse)
async def record_sale(
    data: TraySaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    total = data.trays * data.price_per_tray
    sale = TraySale(
        **data.model_dump(),
        total_price=total,
        farm_id=farm.id,
        recorded_by_id=current_user.id,
    )
    db.add(sale)

    latest = (
        await db.execute(
            select(TrayInventory)
            .where(TrayInventory.farm_id == farm.id)
            .order_by(TrayInventory.date.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    new_inv = TrayInventory(
        farm_id=farm.id,
        opening_stock=latest.closing_stock if latest else 0,
        received=0,
        sold=data.trays,
        closing_stock=(latest.closing_stock if latest else 0) - data.trays,
    )
    db.add(new_inv)
    db.add(
        Notification(
            user_id=current_user.id,
            farm_id=farm.id,
            message=f"Tray sale recorded for {data.trays} trays",
        )
    )

    await db.commit()
    await db.refresh(sale)
    return sale


@router.post("/inventory", response_model=TrayInventoryResponse)
async def update_inventory(
    data: TrayInventoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    inventory = TrayInventory(
        farm_id=farm.id,
        opening_stock=data.opening_stock,
        received=data.received,
        sold=data.sold,
        closing_stock=data.closing_stock,
    )
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)
    return inventory