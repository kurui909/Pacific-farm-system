from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import os
import shutil

from app.database import get_db
from app.models import User, Farm, UserRole
from app.schemas import UserResponse, UserUpdate, AdminUserCreate, UserStatusUpdate
from app.dependencies import get_current_user, get_current_farm
from app.auth import get_password_hash
from app.config import settings
from app.utils import send_welcome_email

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).options(selectinload(User.farm)).where(User.id == current_user.id))
    return result.scalar_one()

@router.put("/me", response_model=UserResponse)
async def update_profile(data: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "password" and value:
            current_user.hashed_password = get_password_hash(value)
        elif value is not None:
            setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/me/profile-picture")
async def upload_profile_pic(image: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    ext = os.path.splitext(image.filename)[1]
    filename = f"profile_{current_user.id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(image.file, f)
    current_user.profile_picture = f"/uploads/{filename}"
    await db.commit()
    return {"url": current_user.profile_picture}

@router.get("/", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    result = await db.execute(select(User).options(selectinload(User.farm)).where(User.farm_id == farm.id))
    return result.scalars().all()

@router.post("/", response_model=UserResponse)
async def create_user(data: AdminUserCreate, db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        farm_id=farm.id,
        role=data.role or UserRole.SUPERVISOR,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    try:
        send_welcome_email(
            user.email,
            user.full_name,
            f"{settings.FRONTEND_URL}/login",
            data.password,
        )
    except Exception as exc:
        print(f"Failed to send welcome email to {user.email}: {exc}")

    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, data: UserUpdate, db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    result = await db.execute(select(User).where(User.id == user_id, User.farm_id == farm.id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "password" and value:
            user.hashed_password = get_password_hash(value)
        elif value is not None:
            setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    result = await db.execute(select(User).where(User.id == user_id, User.farm_id == farm.id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}

@router.patch("/{user_id}/status", response_model=UserResponse)
async def toggle_status(user_id: int, payload: UserStatusUpdate, db: AsyncSession = Depends(get_db), farm: Farm = Depends(get_current_farm)):
    result = await db.execute(select(User).where(User.id == user_id, User.farm_id == farm.id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    return user