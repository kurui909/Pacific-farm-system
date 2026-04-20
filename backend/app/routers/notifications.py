from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_farm, get_current_user
from app.database import get_db
from app.models import Notification, User, UserRole
from app.schemas import NotificationCreate, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=List[NotificationResponse])
async def send_notifications(
    payload: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    farm=Depends(get_current_farm),
):
    if current_user.role not in {UserRole.ADMIN, UserRole.MANAGER}:
        raise HTTPException(status_code=403, detail="Not authorized to send notifications")

    if payload.broadcast:
        users = await db.execute(select(User.id).where(User.farm_id == farm.id))
        user_ids = users.scalars().all()
        if not user_ids:
            raise HTTPException(status_code=404, detail="No users found in this farm")

        notifications = [
            Notification(user_id=user_id, farm_id=farm.id, message=payload.message)
            for user_id in user_ids
        ]
        db.add_all(notifications)
        await db.commit()
        return notifications

    if payload.user_id is None:
        raise HTTPException(status_code=400, detail="Either user_id or broadcast must be provided")

    target_user = await db.get(User, payload.user_id)
    if not target_user or target_user.farm_id != farm.id:
        raise HTTPException(status_code=404, detail="Target user not found")

    notification = Notification(
        user_id=payload.user_id,
        farm_id=farm.id,
        message=payload.message,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return [notification]


@router.post("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id, Notification.read == False)
    )
    notifications = result.scalars().all()
    for notification in notifications:
        notification.read = True
    await db.commit()
    return {"status": "ok"}


@router.post("/{id}/read")
async def mark_read(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = await db.get(Notification, id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.read = True
    await db.commit()
    return {"status": "ok"}


@router.get("/count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = await db.scalar(
        select(func.count()).where(Notification.user_id == current_user.id, Notification.read == False)
    )
    return {"count": count}