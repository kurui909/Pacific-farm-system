from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.database import get_db
from app.models import EggInventory, TrayInventory, TraySale, User, Farm, Notification
from app.schemas import EggInventoryResponse, EggInventoryUpdate, TraySaleCreate, TraySaleResponse
from app.dependencies import get_current_user, get_current_farm, require_active_subscription
from typing import List

router = APIRouter(prefix="/eggs", tags=["eggs"])

@router.get("/inventory", response_model=EggInventoryResponse)
async def get_inventory(db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    result = await db.execute(select(EggInventory).where(EggInventory.farm_id == farm.id).order_by(EggInventory.date.desc()).limit(1))
    inv = result.scalar_one_or_none()
    if not inv:
        inv = EggInventory(farm_id=farm.id, opening_stock=0, closing_stock=0); db.add(inv); await db.commit()
    return inv

@router.post("/inventory", response_model=EggInventoryResponse)
async def update_inventory(data: EggInventoryUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), farm: Farm = Depends(get_current_farm), _: Farm = Depends(require_active_subscription)):
    closing = data.opening_stock - data.sold - data.rejects - data.breakages
    inv = EggInventory(farm_id=farm.id, opening_stock=data.opening_stock, sold=data.sold, rejects=data.rejects, breakages=data.breakages, closing_stock=closing)
    db.add(inv); db.add(Notification(user_id=current_user.id, farm_id=farm.id, message=f"Egg inventory updated")); await db.commit(); await db.refresh(inv)
    return inv

@router.get("/sales", response_model=List[TraySaleResponse])
async def get_sales(db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    return (await db.execute(select(TraySale).where(TraySale.farm_id == farm.id).order_by(TraySale.sale_date.desc()))).scalars().all()

@router.post("/sales", response_model=TraySaleResponse)
async def record_sale(data: TraySaleCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), farm: Farm = Depends(get_current_farm), _: Farm = Depends(require_active_subscription)):
    total = data.trays * data.price_per_tray
    sale = TraySale(**data.model_dump(), total_price=total, sale_date=datetime.combine(data.sale_date, datetime.min.time()), farm_id=farm.id, recorded_by_id=current_user.id)
    db.add(sale)
    inv = (await db.execute(select(TrayInventory).where(TrayInventory.farm_id == farm.id).order_by(TrayInventory.date.desc()).limit(1))).scalar_one_or_none()
    new_inv = TrayInventory(farm_id=farm.id, opening_stock=inv.closing_stock if inv else 0, sold=data.trays, closing_stock=(inv.closing_stock if inv else 0) - data.trays)
    db.add(new_inv)
    await db.commit(); await db.refresh(sale)
    return sale