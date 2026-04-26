from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date, timedelta

from app.database import get_db
from app.models import Farm, ProductionRecord, Pen, User
from app.schemas import (
    ProductionCreate, ProductionUpdate, ProductionResponse,
    BatchProductionCreate, PenLatestProduction
)
from app.dependencies import get_current_farm, get_current_user, require_active_subscription

router = APIRouter(prefix="/production", tags=["production"])

@router.get("", response_model=List[ProductionResponse])
async def get_production_records(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    pen_id: Optional[int] = Query(None, description="Filter by pen ID"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    limit: int = Query(100, description="Limit results"),
    offset: int = Query(0, description="Offset for pagination")
):
    """Get production records with optional filters"""
    query = select(ProductionRecord).where(ProductionRecord.farm_id == farm.id)
    
    if pen_id:
        query = query.where(ProductionRecord.pen_id == pen_id)
    
    if start_date:
        query = query.where(ProductionRecord.date >= start_date)
    
    if end_date:
        query = query.where(ProductionRecord.date <= end_date)
    
    query = query.order_by(desc(ProductionRecord.date)).offset(offset).limit(limit)
    
    result = await db.execute(query)
    records = result.scalars().all()
    
    # Convert to response format with pen names
    response_records = []
    for record in records:
        # Get pen name
        pen_result = await db.execute(select(Pen).where(Pen.id == record.pen_id))
        pen = pen_result.scalar_one_or_none()
        
        response_records.append(ProductionResponse(
            id=record.id,
            date=record.date,
            pen_id=record.pen_id,
            farm_id=record.farm_id,
            age_days=record.age_days,
            week_number=record.week_number,
            opening_stock=record.opening_stock,
            closing_stock=record.closing_stock,
            mortality=record.mortality,
            feed_kg=record.feed_kg,
            good_eggs=record.good_eggs or 0,
            damaged_eggs=record.damaged_eggs or 0,
            small_eggs=record.small_eggs or 0,
            double_yolk_eggs=record.double_yolk_eggs or 0,
            soft_shell_eggs=record.soft_shell_eggs or 0,
            shells=record.shells or 0,
            broody_hen=record.broody_hen or 0,
            culls=record.culls or 0,
            staff_name=record.staff_name,
            image_url=record.image_url,
            total_eggs=record.total_eggs,
            hd_percentage=record.hd_percentage,
            er_ratio=record.er_ratio,
            recorded_by_id=record.recorded_by_id,
            created_at=record.created_at,
            updated_at=record.updated_at,
            pen_name=pen.name if pen else None,
            block_name=pen.block_rel.name if pen and pen.block_rel else None
        ))
    
    return response_records

@router.get("/previous", response_model=Optional[ProductionResponse])
async def get_previous_record(
    pen_id: int = Query(..., description="Pen ID"),
    date: date = Query(..., description="Current date"),
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm)
):
    """Get the previous day's production record for a pen"""
    prev_date = date - timedelta(days=1)
    
    result = await db.execute(
        select(ProductionRecord)
        .where(
            ProductionRecord.pen_id == pen_id,
            ProductionRecord.farm_id == farm.id,
            func.date(ProductionRecord.date) == prev_date
        )
    )
    record = result.scalar_one_or_none()
    
    if not record:
        return None
    
    # Get pen name
    pen_result = await db.execute(select(Pen).where(Pen.id == record.pen_id))
    pen = pen_result.scalar_one_or_none()
    
    return ProductionResponse(
        id=record.id,
        date=record.date,
        pen_id=record.pen_id,
        farm_id=record.farm_id,
        age_days=record.age_days,
        week_number=record.week_number,
        opening_stock=record.opening_stock,
        closing_stock=record.closing_stock,
        mortality=record.mortality,
        feed_kg=record.feed_kg,
        good_eggs=record.good_eggs or 0,
        damaged_eggs=record.damaged_eggs or 0,
        small_eggs=record.small_eggs or 0,
        double_yolk_eggs=record.double_yolk_eggs or 0,
        soft_shell_eggs=record.soft_shell_eggs or 0,
        shells=record.shells or 0,
        broody_hen=record.broody_hen or 0,
        culls=record.culls or 0,
        staff_name=record.staff_name,
        image_url=record.image_url,
        total_eggs=record.total_eggs,
        hd_percentage=record.hd_percentage,
        er_ratio=record.er_ratio,
        recorded_by_id=record.recorded_by_id,
        created_at=record.created_at,
        updated_at=record.updated_at,
        pen_name=pen.name if pen else None,
        block_name=pen.block_rel.name if pen and pen.block_rel else None
    )

@router.post("", response_model=ProductionResponse)
async def create_production_record(
    data: ProductionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription)
):
    """Create a new production record"""
    # Verify pen belongs to farm
    pen_result = await db.execute(
        select(Pen).where(Pen.id == data.pen_id, Pen.farm_id == farm.id)
    )
    pen = pen_result.scalar_one_or_none()
    if not pen:
        raise HTTPException(status_code=404, detail="Pen not found")
    
    # Calculate total eggs if not provided
    total_eggs = data.total_eggs
    if total_eggs is None:
        total_eggs = (data.good_eggs or 0) + (data.damaged_eggs or 0) + (data.small_eggs or 0) + \
                     (data.double_yolk_eggs or 0) + (data.soft_shell_eggs or 0) + (data.shells or 0)
    
    # Calculate HD percentage (Hen Day percentage)
    hd_percentage = None
    if pen.current_birds and pen.current_birds > 0 and total_eggs:
        hd_percentage = (total_eggs / pen.current_birds) * 100
    
    # Calculate ER ratio (Egg to Feed ratio)
    er_ratio = None
    if data.feed_kg and data.feed_kg > 0 and total_eggs:
        er_ratio = total_eggs / data.feed_kg
    
    record = ProductionRecord(
        date=datetime.combine(data.date, datetime.min.time()),
        pen_id=data.pen_id,
        farm_id=farm.id,
        age_days=data.age_days,
        week_number=data.week_number,
        opening_stock=data.opening_stock,
        closing_stock=data.closing_stock,
        mortality=data.mortality,
        feed_kg=data.feed_kg,
        good_eggs=data.good_eggs or 0,
        damaged_eggs=data.damaged_eggs or 0,
        small_eggs=data.small_eggs or 0,
        double_yolk_eggs=data.double_yolk_eggs or 0,
        soft_shell_eggs=data.soft_shell_eggs or 0,
        shells=data.shells or 0,
        broody_hen=data.broody_hen or 0,
        culls=data.culls or 0,
        staff_name=data.staff_name,
        image_url=data.image_url,
        total_eggs=total_eggs,
        hd_percentage=hd_percentage,
        er_ratio=er_ratio,
        recorded_by_id=current_user.id
    )
    
    db.add(record)
    await db.commit()
    await db.refresh(record)
    
    return ProductionResponse(
        id=record.id,
        date=record.date,
        pen_id=record.pen_id,
        farm_id=record.farm_id,
        age_days=record.age_days,
        week_number=record.week_number,
        opening_stock=record.opening_stock,
        closing_stock=record.closing_stock,
        mortality=record.mortality,
        feed_kg=record.feed_kg,
        good_eggs=record.good_eggs,
        damaged_eggs=record.damaged_eggs,
        small_eggs=record.small_eggs,
        double_yolk_eggs=record.double_yolk_eggs,
        soft_shell_eggs=record.soft_shell_eggs,
        shells=record.shells,
        broody_hen=record.broody_hen,
        culls=record.culls,
        staff_name=record.staff_name,
        image_url=record.image_url,
        total_eggs=record.total_eggs,
        hd_percentage=record.hd_percentage,
        er_ratio=record.er_ratio,
        recorded_by_id=record.recorded_by_id,
        created_at=record.created_at,
        updated_at=record.updated_at,
        pen_name=pen.name,
        block_name=pen.block_rel.name if pen.block_rel else None
    )

@router.put("/{record_id}", response_model=ProductionResponse)
async def update_production_record(
    record_id: int,
    data: ProductionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm: Farm = Depends(get_current_farm)
):
    """Update a production record"""
    result = await db.execute(
        select(ProductionRecord).where(
            ProductionRecord.id == record_id,
            ProductionRecord.farm_id == farm.id
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Production record not found")
    
    # Update fields
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    
    await db.commit()
    await db.refresh(record)
    
    # Get pen name
    pen_result = await db.execute(select(Pen).where(Pen.id == record.pen_id))
    pen = pen_result.scalar_one_or_none()
    
    return ProductionResponse(
        id=record.id,
        date=record.date,
        pen_id=record.pen_id,
        farm_id=record.farm_id,
        age_days=record.age_days,
        week_number=record.week_number,
        opening_stock=record.opening_stock,
        closing_stock=record.closing_stock,
        mortality=record.mortality,
        feed_kg=record.feed_kg,
        good_eggs=record.good_eggs or 0,
        damaged_eggs=record.damaged_eggs or 0,
        small_eggs=record.small_eggs or 0,
        double_yolk_eggs=record.double_yolk_eggs or 0,
        soft_shell_eggs=record.soft_shell_eggs or 0,
        shells=record.shells or 0,
        broody_hen=record.broody_hen or 0,
        culls=record.culls or 0,
        staff_name=record.staff_name,
        image_url=record.image_url,
        total_eggs=record.total_eggs,
        hd_percentage=record.hd_percentage,
        er_ratio=record.er_ratio,
        recorded_by_id=record.recorded_by_id,
        created_at=record.created_at,
        updated_at=record.updated_at,
        pen_name=pen.name if pen else None,
        block_name=pen.block_rel.name if pen and pen.block_rel else None
    )

@router.delete("/{record_id}")
async def delete_production_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm)
):
    """Delete a production record"""
    result = await db.execute(
        select(ProductionRecord).where(
            ProductionRecord.id == record_id,
            ProductionRecord.farm_id == farm.id
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Production record not found")
    
    await db.delete(record)
    await db.commit()
    
    return {"message": "Production record deleted successfully"}

@router.post("/batch", response_model=List[ProductionResponse])
async def create_batch_production(
    data: BatchProductionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm: Farm = Depends(get_current_farm)
):
    """Create multiple production records in batch"""
    # Verify pen belongs to farm
    pen_result = await db.execute(
        select(Pen).where(Pen.id == data.pen_id, Pen.farm_id == farm.id)
    )
    pen = pen_result.scalar_one_or_none()
    if not pen:
        raise HTTPException(status_code=404, detail="Pen not found")
    
    # Calculate total eggs
    total_eggs = (data.good_eggs or 0) + (data.damaged_eggs or 0) + (data.small_eggs or 0) + \
                 (data.double_yolk_eggs or 0) + (data.soft_shell_eggs or 0) + (data.shells or 0)
    
    record = ProductionRecord(
        date=data.date,
        pen_id=data.pen_id,
        farm_id=farm.id,
        opening_stock=data.opening_stock,
        closing_stock=data.closing_stock,
        mortality=data.mortality,
        feed_kg=data.feed_kg,
        good_eggs=data.good_eggs or 0,
        damaged_eggs=data.damaged_eggs or 0,
        small_eggs=data.small_eggs or 0,
        double_yolk_eggs=data.double_yolk_eggs or 0,
        soft_shell_eggs=data.soft_shell_eggs or 0,
        shells=data.shells or 0,
        broody_hen=data.broody_hen or 0,
        culls=data.culls or 0,
        staff_name=data.staff_name,
        image_url=data.image_url,
        total_eggs=total_eggs,
        recorded_by_id=current_user.id
    )
    
    db.add(record)
    await db.commit()
    await db.refresh(record)
    
    return [ProductionResponse(
        id=record.id,
        date=record.date,
        pen_id=record.pen_id,
        farm_id=record.farm_id,
        age_days=record.age_days,
        week_number=record.week_number,
        opening_stock=record.opening_stock,
        closing_stock=record.closing_stock,
        mortality=record.mortality,
        feed_kg=record.feed_kg,
        good_eggs=record.good_eggs,
        damaged_eggs=record.damaged_eggs,
        small_eggs=record.small_eggs,
        double_yolk_eggs=record.double_yolk_eggs,
        soft_shell_eggs=record.soft_shell_eggs,
        shells=record.shells,
        broody_hen=record.broody_hen,
        culls=record.culls,
        staff_name=record.staff_name,
        image_url=record.image_url,
        total_eggs=record.total_eggs,
        hd_percentage=record.hd_percentage,
        er_ratio=record.er_ratio,
        recorded_by_id=record.recorded_by_id,
        created_at=record.created_at,
        updated_at=record.updated_at,
        pen_name=pen.name,
        block_name=pen.block_rel.name if pen.block_rel else None
    )]