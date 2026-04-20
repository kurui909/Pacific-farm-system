from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Farm
from ..schemas import FarmCreate, FarmResponse, FarmUpdate
from ..dependencies import require_active_subscription

router = APIRouter()

@router.get("/", response_model=list[FarmResponse])
async def get_all_farms(db: AsyncSession = Depends(get_db), _=Depends(require_active_subscription)):
    result = await db.execute(select(Farm))
    farms = result.scalars().all()
    return farms

@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm_by_id(farm_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_active_subscription)):
    result = await db.execute(select(Farm).where(Farm.id == farm_id))
    farm = result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm

@router.post("/", response_model=FarmResponse)
async def create_farm(farm: FarmCreate, db: AsyncSession = Depends(get_db), _=Depends(require_active_subscription)):
    new_farm = Farm(**farm.dict())
    db.add(new_farm)
    await db.commit()
    await db.refresh(new_farm)
    return new_farm

@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(farm_id: int, farm_update: FarmUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_active_subscription)):
    result = await db.execute(select(Farm).where(Farm.id == farm_id))
    farm = result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    for key, value in farm_update.dict(exclude_unset=True).items():
        setattr(farm, key, value)
    
    await db.commit()
    await db.refresh(farm)
    return farm

@router.delete("/{farm_id}")
async def delete_farm(farm_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_active_subscription)):
    result = await db.execute(select(Farm).where(Farm.id == farm_id))
    farm = result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    await db.delete(farm)
    await db.commit()
    return {"message": "Farm deleted successfully"}