from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import date, datetime

from app.database import get_db
from app.models import Pen, Farm, User, Environment, Block
from app.schemas import (
    PenCreate, PenUpdate, PenResponse,
    EnvironmentCreate, MortalityRecord
)
from app.dependencies import get_current_user, get_current_farm, require_active_subscription

router = APIRouter(prefix="/pens", tags=["pens"])


# ---------------------- CRUD Endpoints ----------------------

@router.get("/", response_model=List[PenResponse])
async def get_pens(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    """Get all pens for the current farm."""
    result = await db.execute(
        select(Pen).where(Pen.farm_id == farm.id).order_by(Pen.name)
    )
    pens = result.scalars().all()

    # Fetch block names for each pen
    block_ids = [p.block_id for p in pens if p.block_id]
    blocks_map = {}
    if block_ids:
        block_result = await db.execute(
            select(Block).where(Block.id.in_(block_ids))
        )
        blocks_map = {b.id: b.name for b in block_result.scalars().all()}

    # Add block_name to each pen response
    for pen in pens:
        pen.block_name = blocks_map.get(pen.block_id)

    return pens


@router.get("/summary", response_model=List[PenResponse])
async def get_pen_summary(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    """Alias for GET / – used by frontend summary."""
    return await get_pens(db, farm)


@router.get("/{pen_id}", response_model=PenResponse)
async def get_pen(
    pen_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    """Get a single pen by ID."""
    result = await db.execute(
        select(Pen).where(Pen.id == pen_id, Pen.farm_id == farm.id)
    )
    pen = result.scalar_one_or_none()
    if not pen:
        raise HTTPException(status_code=404, detail="Pen not found")

    # Add block name
    if pen.block_id:
        block_result = await db.execute(
            select(Block).where(Block.id == pen.block_id)
        )
        block = block_result.scalar_one_or_none()
        pen.block_name = block.name if block else None

    return pen


@router.post("/", response_model=PenResponse, status_code=status.HTTP_201_CREATED)
async def create_pen(
    pen_data: PenCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm: Farm = Depends(get_current_farm),
    _ = Depends(require_active_subscription),
):
    """Create a new pen."""
    # Validate block if provided
    if pen_data.block_id:
        block_result = await db.execute(
            select(Block).where(Block.id == pen_data.block_id, Block.farm_id == farm.id)
        )
        if not block_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Block not found in this farm")

    # Convert empty strings to None for optional fields (already handled by Pydantic, but explicit)
    # Pydantic already sets optional fields to None if not provided, but we ensure no empty strings
    create_dict = pen_data.model_dump(exclude_unset=True)
    for key, value in create_dict.items():
        if value == "":
            create_dict[key] = None

    new_pen = Pen(
        **create_dict,
        farm_id=farm.id,
        user_id=current_user.id,
    )
    db.add(new_pen)
    await db.commit()
    await db.refresh(new_pen)
    return new_pen


@router.put("/{pen_id}", response_model=PenResponse)
async def update_pen(
    pen_id: int,
    pen_data: PenUpdate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _ = Depends(require_active_subscription),
):
    """Update an existing pen."""
    result = await db.execute(
        select(Pen).where(Pen.id == pen_id, Pen.farm_id == farm.id)
    )
    pen = result.scalar_one_or_none()
    if not pen:
        raise HTTPException(status_code=404, detail="Pen not found")

    # Validate block if being updated
    if pen_data.block_id is not None:
        if pen_data.block_id:
            block_result = await db.execute(
                select(Block).where(Block.id == pen_data.block_id, Block.farm_id == farm.id)
            )
            if not block_result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Block not found in this farm")

    update_dict = pen_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value == "":
            setattr(pen, key, None)
        else:
            setattr(pen, key, value)

    await db.commit()
    await db.refresh(pen)
    return pen


@router.delete("/{pen_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pen(
    pen_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _ = Depends(require_active_subscription),
):
    """Delete a pen (cascade deletes production records, environment records)."""
    result = await db.execute(
        select(Pen).where(Pen.id == pen_id, Pen.farm_id == farm.id)
    )
    pen = result.scalar_one_or_none()
    if not pen:
        raise HTTPException(status_code=404, detail="Pen not found")

    await db.delete(pen)
    await db.commit()


# ---------------------- Environment Endpoints ----------------------

@router.get("/{pen_id}/environment", response_model=EnvironmentCreate)
async def get_latest_environment(
    pen_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    """Get the latest environment record for a pen."""
    # Verify pen belongs to farm
    pen_check = await db.execute(
        select(Pen).where(Pen.id == pen_id, Pen.farm_id == farm.id)
    )
    if not pen_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Pen not found")

    # Get latest environment record
    stmt = (
        select(Environment)
        .where(Environment.pen_id == pen_id)
        .order_by(Environment.date.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    env = result.scalar_one_or_none()

    if not env:
        # Return empty environment (all fields null)
        return EnvironmentCreate(pen_id=pen_id)

    return EnvironmentCreate(
        pen_id=env.pen_id,
        temperature=env.temperature,
        humidity=env.humidity,
        ammonia=env.ammonia,
        co2=env.co2,
        light_intensity=env.light_intensity,
        notes=env.notes,
    )


@router.post("/{pen_id}/environment", status_code=status.HTTP_201_CREATED)
async def create_environment_record(
    pen_id: int,
    env_data: EnvironmentCreate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _ = Depends(require_active_subscription),
):
    """Create a new environment record for a pen."""
    # Verify pen belongs to farm
    pen_check = await db.execute(
        select(Pen).where(Pen.id == pen_id, Pen.farm_id == farm.id)
    )
    if not pen_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Pen not found")

    new_env = Environment(
        pen_id=pen_id,
        temperature=env_data.temperature,
        humidity=env_data.humidity,
        ammonia=env_data.ammonia,
        co2=env_data.co2,
        light_intensity=env_data.light_intensity,
        notes=env_data.notes,
        date=datetime.now(),
    )
    db.add(new_env)
    await db.commit()
    await db.refresh(new_env)
    return {"message": "Environment record created", "id": new_env.id}


# ---------------------- Mortality Endpoint ----------------------

@router.post("/{pen_id}/mortality", status_code=status.HTTP_200_OK)
async def record_mortality(
    pen_id: int,
    mortality_data: MortalityRecord,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    current_user: User = Depends(get_current_user),
    _ = Depends(require_active_subscription),
):
    """Record mortality for a pen (updates current_birds and mortality_last_7d)."""
    # Verify pen belongs to farm
    result = await db.execute(
        select(Pen).where(Pen.id == pen_id, Pen.farm_id == farm.id)
    )
    pen = result.scalar_one_or_none()
    if not pen:
        raise HTTPException(status_code=404, detail="Pen not found")

    # Update pen metrics
    pen.mortality_last_7d = (pen.mortality_last_7d or 0) + mortality_data.mortality_count
    pen.current_birds = max(0, (pen.current_birds or 0) - mortality_data.mortality_count)

    await db.commit()

    return {
        "message": f"Mortality recorded: {mortality_data.mortality_count} birds",
        "pen_id": pen_id,
        "current_birds": pen.current_birds,
        "mortality_last_7d": pen.mortality_last_7d
    }