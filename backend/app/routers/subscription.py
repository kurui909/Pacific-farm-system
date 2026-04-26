from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, date, timezone
import stripe
import hmac
import hashlib
import json

from app.database import get_db
from app.models import User, Farm
from app.schemas import SubscriptionStatus
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/subscription")
stripe.api_key = settings.STRIPE_SECRET_KEY

PLAN_PRICES = {
    "pro": "price_pro_monthly",      # Replace with actual Stripe Price ID
    "premium": "price_premium_monthly",
}

@router.get("/status", response_model=SubscriptionStatus)
async def get_status(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    farm = await db.get(Farm, current_user.farm_id)
    if not farm:
        return SubscriptionStatus(status="inactive", plan="none", is_active=False, trial_end=None, subscription_expires=None, trial_available=False, trial_used=False)
    
    now = datetime.now(timezone.utc)
    
    # Check trial status first
    if farm.trial_end and farm.trial_end > now:
        status = "trialing"
    # Check subscription expiration
    elif farm.subscription_expires and farm.subscription_expires > now:
        status = "active"
    elif farm.subscription_expires and farm.subscription_expires < now:
        status = "expired"
    # Fall back to is_active flag
    elif farm.is_active:
        status = "active"
    else:
        status = "inactive"
    
    return SubscriptionStatus(
        status=status, plan=farm.plan or "free_trial", is_active=farm.is_active,
        trial_end=farm.trial_end.date() if farm.trial_end else None,
        subscription_expires=farm.subscription_expires.date() if farm.subscription_expires else None,
        trial_available=not farm.trial_used if farm.trial_used is not None else True,
        trial_used=farm.trial_used or False,
        trial_start=farm.trial_start.date() if farm.trial_start else None
    )

@router.post("/start-trial", response_model=SubscriptionStatus)
async def start_trial(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    farm = await db.get(Farm, current_user.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.trial_used:
        raise HTTPException(status_code=400, detail="Trial already used")

    farm.trial_used = True
    farm.trial_start = datetime.now(timezone.utc)
    farm.trial_end = datetime.now(timezone.utc) + timedelta(days=14)
    farm.is_active = True
    await db.commit()
    await db.refresh(farm)

    return SubscriptionStatus(
        status="trialing", plan=farm.plan or "free_trial", is_active=farm.is_active,
        trial_end=farm.trial_end.date(), subscription_expires=farm.subscription_expires.date() if farm.subscription_expires else None,
        trial_available=False, trial_used=farm.trial_used, trial_start=farm.trial_start.date()
    )

@router.post("/subscribe")
async def create_subscription(plan: str = "pro", current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose: pro, premium")
    
    farm = await db.get(Farm, current_user.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    try:
        session = stripe.checkout.Session.create(
            mode="subscription", payment_method_types=["card"],
            line_items=[{"price": PLAN_PRICES[plan], "quantity": 1}],
            success_url="http://localhost:3000/dashboard?success=true",
            cancel_url="http://localhost:3000/subscription?canceled=true",
            customer_email=current_user.email,
            metadata={"farm_id": str(farm.id), "user_id": str(current_user.id)},
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if settings.STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except stripe.error.SignatureVerificationError:
            return Response(status_code=400)
    else:
        event = json.loads(payload)
    
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        farm_id = session.get("metadata", {}).get("farm_id")
        if farm_id:
            farm = await db.get(Farm, int(farm_id))
            if farm:
                farm.plan = "paid"
                farm.is_active = True
                farm.stripe_subscription_id = session.get("subscription")
                await db.commit()
    
    return {"status": "received"}