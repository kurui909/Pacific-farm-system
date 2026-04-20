from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date, timedelta
from app.database import get_db
from app.models import ProductionRecord, Farm, Pen
from app.schemas import DashboardMetrics
from app.dependencies import get_current_farm, require_active_subscription

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/metrics", response_model=DashboardMetrics)
async def get_metrics(
    date_range: str = Query("today"),
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription)
):
    today = date.today()
    start = today if date_range == "today" else (today - timedelta(days=7) if date_range == "week" else today - timedelta(days=30))

    # Total pens
    pens_count = await db.execute(select(func.count(Pen.id)).where(Pen.farm_id == farm.id))
    total_pens = pens_count.scalar() or 0

    # Total eggs today
    eggs_today_result = await db.execute(
        select(func.sum(ProductionRecord.total_eggs))
        .where(ProductionRecord.farm_id == farm.id, func.date(ProductionRecord.date) == today)
    )
    total_eggs_today = eggs_today_result.scalar() or 0

    # Total eggs over selected range
    eggs_range_result = await db.execute(
        select(func.sum(ProductionRecord.total_eggs))
        .where(ProductionRecord.farm_id == farm.id, func.date(ProductionRecord.date) >= start)
    )
    total_eggs_range = eggs_range_result.scalar() or 0

    # Latest chicken count (closing stock from most recent date per pen)
    subq = select(ProductionRecord.pen_id, func.max(ProductionRecord.date).label("max_date"))\
        .where(ProductionRecord.farm_id == farm.id)\
        .group_by(ProductionRecord.pen_id).subquery()
    chickens = await db.execute(
        select(func.sum(ProductionRecord.closing_stock))
        .join(subq, (ProductionRecord.pen_id == subq.c.pen_id) & (ProductionRecord.date == subq.c.max_date))
    )
    total_birds = chickens.scalar() or 0

    # Average occupancy (closing_stock / capacity for latest per pen)
    occupancy = await db.execute(
        select(func.avg(ProductionRecord.closing_stock / Pen.capacity))
        .join(Pen, Pen.id == ProductionRecord.pen_id)
        .join(subq, (ProductionRecord.pen_id == subq.c.pen_id) & (ProductionRecord.date == subq.c.max_date))
    )
    average_occupancy = occupancy.scalar() or 0.0

    # Total feed used in range
    feed_range = await db.execute(
        select(func.sum(ProductionRecord.feed_kg))
        .where(ProductionRecord.farm_id == farm.id, func.date(ProductionRecord.date) >= start)
    )
    total_feed_used = feed_range.scalar() or 0.0

    # Feed consumption today
    feed_today_result = await db.execute(
        select(func.sum(ProductionRecord.feed_kg))
        .where(ProductionRecord.farm_id == farm.id, func.date(ProductionRecord.date) == today)
    )
    feed_consumption_today = feed_today_result.scalar() or 0.0

    # Mortality today (sum of mortality column for today's records)
    mortality_today_result = await db.execute(
        select(func.sum(ProductionRecord.mortality))
        .where(ProductionRecord.farm_id == farm.id, func.date(ProductionRecord.date) == today)
    )
    mortality_today = mortality_today_result.scalar() or 0

    # Average egg quality – if you have an egg_quality column in ProductionRecord, use it; otherwise 0
    # Example if column exists: 
    # avg_quality = await db.execute(
    #     select(func.avg(ProductionRecord.egg_quality))
    #     .where(ProductionRecord.farm_id == farm.id, func.date(ProductionRecord.date) >= start)
    # )
    # avg_egg_quality = avg_quality.scalar() or 0.0
    avg_egg_quality = 0.0

    return {
        "total_pens": total_pens,
        "total_birds": total_birds,
        "average_occupancy": average_occupancy,
        "total_eggs": total_eggs_range,
        "total_feed_used": total_feed_used,
        "total_eggs_today": total_eggs_today,
        "feed_consumption_today": feed_consumption_today,
        "mortality_today": mortality_today,
        "avg_egg_quality": avg_egg_quality,
    }