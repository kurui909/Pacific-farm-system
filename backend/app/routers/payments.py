from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Farm, Payment
from app.schemas import PaymentResponse
from app.dependencies import get_current_user, get_current_farm, require_active_subscription

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/", response_model=List[PaymentResponse])
async def get_payments(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    result = await db.execute(select(Payment).where(Payment.farm_id == farm.id).order_by(Payment.created_at.desc()))
    return result.scalars().all()


@router.post("/{payment_id}/approve", response_model=PaymentResponse)
async def approve_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    payment = await db.get(Payment, payment_id)
    if not payment or payment.farm_id != farm.id:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment.status = "approved"
    await db.commit()
    await db.refresh(payment)
    return payment


@router.post("/{payment_id}/reject", response_model=PaymentResponse)
async def reject_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
):
    payment = await db.get(Payment, payment_id)
    if not payment or payment.farm_id != farm.id:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment.status = "rejected"
    await db.commit()
    await db.refresh(payment)
    return payment