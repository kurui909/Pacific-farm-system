from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import secrets
from app.database import get_db
from app.models import User, Farm
from app.schemas import UserCreate, Token, UserResponse, GoogleAuthData, ResetPasswordRequest
from app.auth import get_password_hash, verify_password, create_access_token
from app.utils import send_reset_email
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()

    if data.password != data.confirm_password:
        raise HTTPException(400, "Passwords do not match")

    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        full_name=data.full_name,
        email=email,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)
    await db.flush()

    # FIX: Provide a default farm name if none is given
    farm_name = data.farm_name if hasattr(data, 'farm_name') and data.farm_name else f"{user.full_name}'s Farm"
    farm = Farm(name=farm_name, owner_id=user.id)
    db.add(farm)
    await db.flush()

    user.farm_id = farm.id
    user.farm = farm

    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    username = form_data.username.strip().lower()
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_access_token({"sub": user.email}), "token_type": "bearer"}

@router.post("/google", response_model=Token)
async def google_auth(data: GoogleAuthData, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {data.access_token}"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid access token")
        profile = response.json()
    
    email = profile["email"]
    full_name = profile["name"]
    google_id = profile["sub"]
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            full_name=full_name,
            email=email,
            hashed_password=get_password_hash(secrets.token_urlsafe(16)),
            google_id=google_id,
        )
        db.add(user)
        await db.flush()

        farm = Farm(name=f"{full_name}'s Farm", owner_id=user.id)
        db.add(farm)
        await db.flush()

        user.farm_id = farm.id
        user.farm = farm

        await db.commit()
        await db.refresh(user)
    elif not user.google_id:
        user.google_id = google_id
        await db.commit()

    return {"access_token": create_access_token({"sub": user.email}), "token_type": "bearer"}

@router.post("/forgot-password")
async def forgot_password(
    email: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        token = secrets.token_urlsafe(32)
        user.reset_password_token = token
        user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
        await db.commit()
        background_tasks.add_task(send_reset_email, user.email, user.full_name, token)

    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.reset_password_token == payload.token))
    user = result.scalar_one_or_none()

    if not user or not user.reset_password_expires or user.reset_password_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token is invalid or expired")

    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    await db.commit()
    await db.refresh(user)

    return {"message": "Password reset successful"}