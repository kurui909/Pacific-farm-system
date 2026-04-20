from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

from app.database import get_db
from app.auth import verify_token
from app.models import User, Farm


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token)
    if not token_data:
        raise credentials_exception

    result = await db.execute(
        select(User)
        .options(selectinload(User.farm))
        .where(User.email == token_data.email)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


async def get_current_farm(
    current_user: User = Depends(get_current_active_user)
) -> Farm:
    if not current_user.farm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No farm associated with this user"
        )
    return current_user.farm


async def require_active_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Farm:
    farm = await db.get(Farm, current_user.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    now = datetime.now(timezone.utc)

    trial_active = False
    if farm.trial_end is not None:
        trial_end = farm.trial_end
        if isinstance(trial_end, datetime) and trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=timezone.utc)
        trial_active = now.date() <= trial_end.date()

    subscription_active = False
    if farm.subscription_expires is not None:
        subscription_expires = farm.subscription_expires
        if subscription_expires.tzinfo is None:
            subscription_expires = subscription_expires.replace(tzinfo=timezone.utc)
        subscription_active = now <= subscription_expires

    if not trial_active and not subscription_active:
        raise HTTPException(status_code=403, detail="Active subscription required")

    return farm

