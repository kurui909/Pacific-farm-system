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

@router.get("/inventory", response_model=List[EggInventoryResponse])
async def get_inventory(db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    """Get all egg inventory records for the current farm"""
    result = await db.execute(
        select(EggInventory)
        .where(EggInventory.farm_id == farm.id)
        .order_by(EggInventory.date.desc())
    )
    inventories = result.scalars().all()
    return inventories if inventories else []

@router.post("/inventory", response_model=EggInventoryResponse)
async def update_inventory(
    data: EggInventoryUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user), 
    farm: Farm = Depends(get_current_farm), 
    _: Farm = Depends(require_active_subscription)
):
    """Update egg inventory"""
    # Calculate closing stock
    opening = data.opening_stock if hasattr(data, 'opening_stock') else 0
    sold = data.sold if hasattr(data, 'sold') else 0
    rejects = data.rejects if hasattr(data, 'rejects') else 0
    breakages = data.breakages if hasattr(data, 'breakages') else 0
    closing = opening - sold - rejects - breakages
    
    inv = EggInventory(
        farm_id=farm.id,
        opening_stock=opening,
        sold=sold,
        rejects=rejects,
        breakages=breakages,
        closing_stock=closing,
        good_eggs=data.good_eggs if hasattr(data, 'good_eggs') else 0,
        damaged_eggs=data.damaged_eggs if hasattr(data, 'damaged_eggs') else 0,
        small_eggs=data.small_eggs if hasattr(data, 'small_eggs') else 0,
        double_yolk_eggs=data.double_yolk_eggs if hasattr(data, 'double_yolk_eggs') else 0,
        soft_shell_eggs=data.soft_shell_eggs if hasattr(data, 'soft_shell_eggs') else 0,
        shells=data.shells if hasattr(data, 'shells') else 0,
    )
    db.add(inv)
    db.add(Notification(
        user_id=current_user.id, 
        farm_id=farm.id, 
        message=f"Egg inventory updated"
    ))
    await db.commit()
    await db.refresh(inv)
    return inv

@router.get("/sales", response_model=List[TraySaleResponse])
async def get_sales(db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    """Get all egg/tray sales"""
    return (await db.execute(
        select(TraySale).where(TraySale.farm_id == farm.id).order_by(TraySale.sale_date.desc())
    )).scalars().all()

@router.post("/sales", response_model=TraySaleResponse)
async def record_sale(
    data: TraySaleCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user), 
    farm: Farm = Depends(get_current_farm), 
    _: Farm = Depends(require_active_subscription)
):
    """Record a new egg/tray sale"""
    total = data.trays * data.price_per_tray
    sale = TraySale(
        **data.model_dump(), 
        total_price=total, 
        sale_date=datetime.combine(data.sale_date, datetime.min.time()), 
        farm_id=farm.id, 
        recorded_by_id=current_user.id
    )
    db.add(sale)
    
    inv = (await db.execute(
        select(TrayInventory).where(TrayInventory.farm_id == farm.id).order_by(TrayInventory.date.desc()).limit(1)
    )).scalar_one_or_none()
    
    new_inv = TrayInventory(
        farm_id=farm.id, 
        opening_stock=inv.closing_stock if inv else 0, 
        sold=data.trays, 
        closing_stock=(inv.closing_stock if inv else 0) - data.trays
    )
    db.add(new_inv)
    await db.commit()
    await db.refresh(sale)
    return sale