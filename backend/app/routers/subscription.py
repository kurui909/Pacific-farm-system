from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, date

from app.database import get_db
from app.models import User, Farm
from app.schemas import SubscriptionStatus
from app.dependencies import get_current_user


router = APIRouter(prefix="/subscription")

@router.get("/status", response_model=SubscriptionStatus)
async def get_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    farm = await db.get(Farm, current_user.farm_id)
    if not farm:
        return SubscriptionStatus(
            status="inactive",
            plan="none",
            is_active=False,
            trial_end=None,
            subscription_expires=None,
            trial_available=False,
            trial_used=False
        )
    
    # Determine status
    now = datetime.utcnow()
    status = "active"
    if not farm.is_active:
        status = "inactive"
    elif farm.trial_end and farm.trial_end > now:
        status = "trialing"
    elif farm.subscription_expires and farm.subscription_expires < now:
        status = "expired"
    
    # Convert datetime to date if needed (Pydantic expects date, not datetime)
    trial_end_date = farm.trial_end.date() if farm.trial_end else None
    sub_expires_date = farm.subscription_expires.date() if farm.subscription_expires else None
    trial_start_date = farm.trial_start.date() if farm.trial_start else None
    
    return SubscriptionStatus(
        status=status,
        plan=farm.plan or "free_trial",
        is_active=farm.is_active,
        trial_end=trial_end_date,
        subscription_expires=sub_expires_date,
        trial_available=not farm.trial_used if farm.trial_used is not None else True,
        trial_used=farm.trial_used or False,
        trial_start=trial_start_date
    )

@router.post("/start-trial", response_model=SubscriptionStatus)
async def start_trial(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    farm = await db.get(Farm, current_user.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if farm.trial_used:
        raise HTTPException(status_code=400, detail="Trial already used")

    farm.trial_used = True
    farm.trial_start = datetime.utcnow()
    farm.trial_end = datetime.utcnow() + timedelta(days=14)
    farm.is_active = True

    await db.commit()
    await db.refresh(farm)

    # Convert datetime to date
    trial_end_date = farm.trial_end.date()
    trial_start_date = farm.trial_start.date()
    sub_expires_date = farm.subscription_expires.date() if farm.subscription_expires else None

    return SubscriptionStatus(
        status="trialing",
        plan=farm.plan or "free_trial",
        is_active=farm.is_active,
        trial_end=trial_end_date,
        subscription_expires=sub_expires_date,
        trial_available=False,
        trial_used=farm.trial_used,
        trial_start=trial_start_date
    )