from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.models import ProductionRecord, Pen, Farm, Block
import app.schemas as schema
from app.dependencies import get_db, get_current_farm, require_active_subscription, get_current_user

router = APIRouter(prefix="/production", tags=["production"])


# ---------- Helper to enrich production record with pen name and block name ----------
async def enrich_production_record(db: AsyncSession, record):
    """Attach pen_name and block_name to a production record."""
    pen_result = await db.execute(select(Pen).where(Pen.id == record.pen_id))
    pen = pen_result.scalar_one_or_none()
    if pen:
        record.pen_name = pen.name
        if pen.block_id:
            block_result = await db.execute(select(Block).where(Block.id == pen.block_id))
            block = block_result.scalar_one_or_none()
            record.block_name = block.name if block else None
        else:
            record.block_name = None
    else:
        record.pen_name = None
        record.block_name = None
    return record


# ---------- Main CRUD ----------
@router.get("/", response_model=List[schema.ProductionResponse])
async def get_production(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
    pen_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
):
    """Get production records with optional filters (pen, date range, search by staff or pen name)"""
    stmt = select(ProductionRecord).where(ProductionRecord.farm_id == farm.id)
    
    if pen_id:
        stmt = stmt.where(ProductionRecord.pen_id == pen_id)
    if start_date:
        stmt = stmt.where(ProductionRecord.date >= start_date)
    if end_date:
        stmt = stmt.where(ProductionRecord.date <= end_date)
    if search:
        # Search by staff name or pen name (join Pen)
        stmt = stmt.join(Pen, Pen.id == ProductionRecord.pen_id).where(
            Pen.name.ilike(f"%{search}%") | ProductionRecord.staff_name.ilike(f"%{search}%")
        )
    
    result = await db.execute(stmt.order_by(desc(ProductionRecord.date)))
    records = result.scalars().all()
    
    # Enrich each record with pen name and block name
    enriched = []
    for rec in records:
        enriched.append(await enrich_production_record(db, rec))
    return enriched


@router.get("/pens/{pen_id}", response_model=List[schema.ProductionResponse])
async def get_pen_production(
    pen_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    """Get production records for a specific pen (last 30 records)"""
    stmt = (
        select(ProductionRecord)
        .where(ProductionRecord.pen_id == pen_id, ProductionRecord.farm_id == farm.id)
        .order_by(desc(ProductionRecord.date))
        .limit(30)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    enriched = []
    for rec in records:
        enriched.append(await enrich_production_record(db, rec))
    return enriched


@router.get("/{record_id}", response_model=schema.ProductionResponse)
async def get_production_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    """Get a single production record"""
    stmt = select(ProductionRecord).where(
        ProductionRecord.id == record_id, ProductionRecord.farm_id == farm.id
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Production record not found")
    return await enrich_production_record(db, record)


@router.post("/", response_model=schema.ProductionResponse, status_code=201)
async def create_production(
    production: schema.ProductionCreate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    current_user=Depends(get_current_user),
    _: Farm = Depends(require_active_subscription),
):
    """Create a single production record"""
    pen = await db.get(Pen, production.pen_id)
    if not pen or pen.farm_id != farm.id:
        raise HTTPException(status_code=404, detail="Pen not found")
    
    total_eggs = production.total_eggs
    if total_eggs is None:
        total_eggs = (
            (production.good_eggs or 0) +
            (production.damaged_eggs or 0) +
            (production.small_eggs or 0) +
            (production.double_yolk_eggs or 0) +
            (production.soft_shell_eggs or 0) +
            (production.shells or 0)
        )
    
    hd_percentage = None
    if total_eggs > 0 and production.opening_stock:
        hd_percentage = (total_eggs / production.opening_stock) * 100
    
    er_ratio = None
    if production.feed_kg and total_eggs > 0:
        er_ratio = production.feed_kg / total_eggs
    
    db_record = ProductionRecord(
        farm_id=farm.id,
        pen_id=production.pen_id,
        date=production.date,
        age_days=production.age_days,
        week_number=production.week_number,
        opening_stock=production.opening_stock,
        closing_stock=production.closing_stock,
        mortality=production.mortality,
        feed_kg=production.feed_kg,
        good_eggs=production.good_eggs or 0,
        damaged_eggs=production.damaged_eggs or 0,
        small_eggs=production.small_eggs or 0,
        double_yolk_eggs=production.double_yolk_eggs or 0,
        soft_shell_eggs=production.soft_shell_eggs or 0,
        shells=production.shells or 0,
        broody_hen=production.broody_hen or 0,
        culls=production.culls or 0,
        staff_name=production.staff_name,
        image_url=production.image_url,
        total_eggs=total_eggs,
        hd_percentage=hd_percentage,
        er_ratio=er_ratio,
        recorded_by_id=current_user.id,
    )
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    return await enrich_production_record(db, db_record)


@router.post("/batch", response_model=List[schema.ProductionResponse], status_code=201)
async def create_batch_production(
    batch: List[schema.BatchProductionCreate],
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    current_user=Depends(get_current_user),
    _: Farm = Depends(require_active_subscription),
):
    """Create multiple production records at once"""
    records = []
    
    for production in batch:
        pen = await db.get(Pen, production.pen_id)
        if not pen or pen.farm_id != farm.id:
            raise HTTPException(status_code=404, detail=f"Pen {production.pen_id} not found")
        
        total_eggs = (
            (production.good_eggs or 0) +
            (production.damaged_eggs or 0) +
            (production.small_eggs or 0) +
            (production.double_yolk_eggs or 0) +
            (production.soft_shell_eggs or 0) +
            (production.shells or 0)
        )
        
        hd_percentage = None
        if total_eggs > 0 and production.opening_stock:
            hd_percentage = (total_eggs / production.opening_stock) * 100
        
        er_ratio = None
        if production.feed_kg and total_eggs > 0:
            er_ratio = production.feed_kg / total_eggs
        
        db_record = ProductionRecord(
            farm_id=farm.id,
            pen_id=production.pen_id,
            date=production.date,
            age_days=production.age_days,
            week_number=production.week_number,
            opening_stock=production.opening_stock,
            closing_stock=production.closing_stock,
            mortality=production.mortality,
            feed_kg=production.feed_kg,
            good_eggs=production.good_eggs or 0,
            damaged_eggs=production.damaged_eggs or 0,
            small_eggs=production.small_eggs or 0,
            double_yolk_eggs=production.double_yolk_eggs or 0,
            soft_shell_eggs=production.soft_shell_eggs or 0,
            shells=production.shells or 0,
            broody_hen=production.broody_hen or 0,
            culls=production.culls or 0,
            staff_name=production.staff_name,
            image_url=production.image_url,
            total_eggs=total_eggs,
            hd_percentage=hd_percentage,
            er_ratio=er_ratio,
            recorded_by_id=current_user.id,
        )
        db.add(db_record)
        records.append(db_record)
    
    await db.commit()
    for record in records:
        await db.refresh(record)
    
    enriched = []
    for rec in records:
        enriched.append(await enrich_production_record(db, rec))
    return enriched


@router.put("/{record_id}", response_model=schema.ProductionResponse)
async def update_production(
    record_id: int,
    production: schema.ProductionUpdate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    """Update a production record"""
    stmt = select(ProductionRecord).where(
        ProductionRecord.id == record_id, ProductionRecord.farm_id == farm.id
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Production record not found")
    
    update_dict = production.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(record, key, value)
    
    # Recalculate total_eggs, hd_percentage, er_ratio if egg fields changed
    if any(k in update_dict for k in ["good_eggs", "damaged_eggs", "small_eggs", "double_yolk_eggs", "soft_shell_eggs", "shells"]):
        total_eggs = (record.good_eggs or 0) + (record.damaged_eggs or 0) + (record.small_eggs or 0) + \
                     (record.double_yolk_eggs or 0) + (record.soft_shell_eggs or 0) + (record.shells or 0)
        record.total_eggs = total_eggs
        if total_eggs > 0 and record.opening_stock:
            record.hd_percentage = (total_eggs / record.opening_stock) * 100
        if record.feed_kg and total_eggs > 0:
            record.er_ratio = record.feed_kg / total_eggs
    
    await db.commit()
    await db.refresh(record)
    return await enrich_production_record(db, record)


@router.delete("/{record_id}")
async def delete_production(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    """Delete a production record"""
    stmt = select(ProductionRecord).where(
        ProductionRecord.id == record_id, ProductionRecord.farm_id == farm.id
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Production record not found")
    await db.delete(record)
    await db.commit()
    return {"status": "success", "message": "Production record deleted"}


# ---------- Additional Endpoints ----------
@router.get("/previous", response_model=Optional[schema.ProductionResponse])
async def get_previous_day_record(
    pen_id: int = Query(...),
    date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    """Get the production record for the previous day of the given pen (used to auto-fill opening stock)."""
    previous_date = date - timedelta(days=1)
    stmt = (
        select(ProductionRecord)
        .where(
            ProductionRecord.farm_id == farm.id,
            ProductionRecord.pen_id == pen_id,
            ProductionRecord.date == previous_date,
        )
        .order_by(desc(ProductionRecord.date))
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if record:
        await enrich_production_record(db, record)
    return record


@router.get("/latest-stock", response_model=List[schema.PenLatestProduction])
async def get_latest_closing_stock(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    """Get the latest closing stock (current bird count) for each pen in the farm."""
    subq = (
        select(
            ProductionRecord.pen_id,
            func.max(ProductionRecord.date).label("max_date")
        )
        .where(ProductionRecord.farm_id == farm.id)
        .group_by(ProductionRecord.pen_id)
        .subquery()
    )
    stmt = (
        select(
            ProductionRecord.pen_id,
            ProductionRecord.closing_stock,
            ProductionRecord.date.label("date")
        )
        .join(subq, and_(
            ProductionRecord.pen_id == subq.c.pen_id,
            ProductionRecord.date == subq.c.max_date
        ))
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [{"pen_id": r.pen_id, "closing_stock": r.closing_stock, "date": r.date} for r in rows]