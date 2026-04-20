from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date, timedelta
from app.database import get_db
from app.models import ProductionRecord, Pen, Farm
from app.schemas import PenPerformance, TrendData
from app.dependencies import get_current_farm, require_active_subscription
from typing import List

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/pen-performance", response_model=List[PenPerformance])
async def get_pen_performance(db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm), _: Farm = Depends(require_active_subscription)):
    subq = select(ProductionRecord.pen_id, func.max(ProductionRecord.date).label("max_date")).where(ProductionRecord.farm_id == farm.id).group_by(ProductionRecord.pen_id).subquery()
    query = select(Pen.name, ProductionRecord.closing_stock, ProductionRecord.total_eggs, ProductionRecord.mortality, ProductionRecord.hd_percentage, ProductionRecord.er_ratio).join(subq, (ProductionRecord.pen_id == subq.c.pen_id) & (ProductionRecord.date == subq.c.max_date)).join(Pen, Pen.id == ProductionRecord.pen_id).where(Pen.farm_id == farm.id)
    result = await db.execute(query)
    return [PenPerformance(pen_name=r.name, chickens=r.closing_stock, eggs=r.total_eggs, mortality=r.mortality, hd_percentage=r.hd_percentage, er_ratio=r.er_ratio, score=(r.hd_percentage*0.4 + r.er_ratio*20*0.3 + (100-r.mortality)*0.3)) for r in result]

@router.get("/trends", response_model=List[TrendData])
async def get_trends(period: str = Query("month"), pen_id: int = None, db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm), _: Farm = Depends(require_active_subscription)):
    today = date.today()
    start = today - timedelta(days=7 if period=="week" else 30 if period=="month" else 365)
    query = select(func.date(ProductionRecord.date), func.sum(ProductionRecord.total_eggs), func.sum(ProductionRecord.feed_kg), func.sum(ProductionRecord.mortality), func.avg(ProductionRecord.hd_percentage), func.avg(ProductionRecord.er_ratio)).where(ProductionRecord.farm_id == farm.id, func.date(ProductionRecord.date) >= start).group_by(func.date(ProductionRecord.date)).order_by(func.date(ProductionRecord.date))
    if pen_id: query = query.where(ProductionRecord.pen_id == pen_id)
    result = await db.execute(query)
    return [TrendData(date=r[0], eggs=r[1] or 0, feed=r[2] or 0.0, mortality=r[3] or 0, hd_percent=r[4] or 0.0, er_ratio=r[5] or 0.0) for r in result]