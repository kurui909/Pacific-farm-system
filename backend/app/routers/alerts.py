from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Alert, Farm
from app.schemas import AlertResponse
from app.dependencies import get_current_farm, require_active_subscription

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm), _: Farm = Depends(require_active_subscription)):
    result = await db.execute(select(Alert).where(Alert.farm_id == farm.id, Alert.is_resolved == False).order_by(Alert.created_at.desc()))
    return result.scalars().all()

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    alert = await db.get(Alert, alert_id)
    if not alert or alert.farm_id != farm.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    await db.commit()
    return {"status": "ok"}