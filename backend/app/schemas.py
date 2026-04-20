from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.models import UserRole


# ===== Authentication Schemas =====

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: str


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str
    farm_name: Optional[str] = None
    role: Optional[str] = "admin"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    farm_id: Optional[int] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    contact: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    bio: Optional[str] = None


class AdminUserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "admin"
    farm_id: Optional[int] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class GoogleAuthData(BaseModel):
    access_token: str
    google_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_picture: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: EmailStr


# ===== Production Schemas =====

class ProductionCreate(BaseModel):
    pen_id: int
    date: date
    age_days: Optional[int] = None
    week_number: Optional[float] = None
    opening_stock: int
    closing_stock: int
    mortality: Optional[int] = None
    feed_kg: Optional[float] = None
    good_eggs: Optional[int] = 0
    damaged_eggs: Optional[int] = 0
    small_eggs: Optional[int] = 0
    double_yolk_eggs: Optional[int] = 0
    soft_shell_eggs: Optional[int] = 0
    shells: Optional[int] = 0
    broody_hen: Optional[int] = 0
    culls: Optional[int] = 0
    staff_name: Optional[str] = None
    image_url: Optional[str] = None
    total_eggs: Optional[int] = None


class ProductionUpdate(BaseModel):
    pen_id: Optional[int] = None
    date: Optional[datetime] = None
    age_days: Optional[int] = None
    week_number: Optional[float] = None
    opening_stock: Optional[int] = None
    closing_stock: Optional[int] = None
    mortality: Optional[int] = None
    feed_kg: Optional[float] = None
    good_eggs: Optional[int] = None
    damaged_eggs: Optional[int] = None
    small_eggs: Optional[int] = None
    double_yolk_eggs: Optional[int] = None
    soft_shell_eggs: Optional[int] = None
    shells: Optional[int] = None
    broody_hen: Optional[int] = None
    culls: Optional[int] = None
    staff_name: Optional[str] = None
    image_url: Optional[str] = None
    total_eggs: Optional[int] = None


class ProductionResponse(BaseModel):
    id: int
    date: datetime
    pen_id: int
    farm_id: int
    age_days: Optional[int] = None
    week_number: Optional[float] = None
    opening_stock: int
    closing_stock: int
    mortality: Optional[int] = None
    feed_kg: Optional[float] = None
    good_eggs: int = 0
    damaged_eggs: int = 0
    small_eggs: int = 0
    double_yolk_eggs: int = 0
    soft_shell_eggs: int = 0
    shells: int = 0
    broody_hen: int = 0
    culls: int = 0
    staff_name: Optional[str] = None
    image_url: Optional[str] = None
    total_eggs: Optional[int] = None
    hd_percentage: Optional[float] = None
    er_ratio: Optional[float] = None
    recorded_by_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    pen_name: Optional[str] = None      # Added for frontend
    block_name: Optional[str] = None    # Added for frontend

    class Config:
        from_attributes = True


class BatchProductionCreate(BaseModel):
    pen_id: int
    date: datetime
    opening_stock: int
    closing_stock: int
    mortality: Optional[int] = None
    feed_kg: Optional[float] = None
    good_eggs: Optional[int] = 0
    damaged_eggs: Optional[int] = 0
    small_eggs: Optional[int] = 0
    double_yolk_eggs: Optional[int] = 0
    soft_shell_eggs: Optional[int] = 0
    shells: Optional[int] = 0
    broody_hen: Optional[int] = 0
    culls: Optional[int] = 0
    staff_name: Optional[str] = None
    image_url: Optional[str] = None


# ===== Block Schemas =====

class BlockCreate(BaseModel):
    name: str


class BlockUpdate(BaseModel):
    name: Optional[str] = None


class BlockResponse(BaseModel):
    id: int
    name: str
    farm_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BlockAssignment(BaseModel):
    pen_ids: List[int]


class BlockPenAction(BaseModel):
    pen_id: int


# ===== Environment Schemas (for real-time data) =====

class EnvironmentCreate(BaseModel):
    pen_id: int
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    ammonia: Optional[float] = None
    co2: Optional[float] = None
    light_intensity: Optional[float] = None
    notes: Optional[str] = None


class EnvironmentResponse(EnvironmentCreate):
    id: int
    date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Mortality Record Schema =====

class MortalityRecord(BaseModel):
    mortality_count: int
    cause: Optional[str] = None
    notes: Optional[str] = None


# ===== Pen Latest Production (for summary) =====

class PenLatestProduction(BaseModel):
    pen_id: int
    closing_stock: int
    date: date


# ===== Pen Schemas (updated with block_name) =====

class PenCreate(BaseModel):
    name: str
    status: Optional[str] = "active"
    housing_system: Optional[str] = "deep_litter"
    breed: str
    source_hatchery: Optional[str] = None
    start_date: date
    initial_birds: Optional[int] = None
    batch_name: Optional[str] = None
    birds_per_kg: Optional[float] = None
    capacity: int
    notes: Optional[str] = None
    block_id: Optional[int] = None
    # Deep Litter
    floor_area_sq_m: Optional[float] = None
    max_density: Optional[float] = None
    litter_type: Optional[str] = "wood_shavings"
    feeder_count: Optional[int] = None
    waterer_count: Optional[int] = None
    nest_count: Optional[int] = None
    perch_length_cm: Optional[int] = None
    # Cage
    cell_length_mm: Optional[int] = None
    cell_width_mm: Optional[int] = None
    cell_height_mm: Optional[int] = None
    birds_per_cell: Optional[int] = None
    tiers_per_set: Optional[int] = None
    cells_per_set: Optional[int] = None


class PenUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    housing_system: Optional[str] = None
    breed: Optional[str] = None
    source_hatchery: Optional[str] = None
    start_date: Optional[date] = None
    initial_birds: Optional[int] = None
    batch_name: Optional[str] = None
    birds_per_kg: Optional[float] = None
    capacity: Optional[int] = None
    notes: Optional[str] = None
    block_id: Optional[int] = None
    floor_area_sq_m: Optional[float] = None
    max_density: Optional[float] = None
    litter_type: Optional[str] = None
    feeder_count: Optional[int] = None
    waterer_count: Optional[int] = None
    nest_count: Optional[int] = None
    perch_length_cm: Optional[int] = None
    cell_length_mm: Optional[int] = None
    cell_width_mm: Optional[int] = None
    cell_height_mm: Optional[int] = None
    birds_per_cell: Optional[int] = None
    tiers_per_set: Optional[int] = None
    cells_per_set: Optional[int] = None


class PenResponse(BaseModel):
    id: int
    name: str
    capacity: int
    status: str
    farm_id: int
    user_id: int
    block_id: Optional[int] = None
    start_date: datetime
    housing_system: str = "deep_litter"
    breed: Optional[str] = None
    batch_name: Optional[str] = None
    source_hatchery: Optional[str] = None
    initial_birds: Optional[int] = None
    birds_per_kg: Optional[float] = None
    notes: Optional[str] = None
    floor_area_sq_m: Optional[float] = None
    max_density: Optional[float] = None
    litter_type: Optional[str] = None
    feeder_count: Optional[int] = None
    waterer_count: Optional[int] = None
    nest_count: Optional[int] = None
    perch_length_cm: Optional[int] = None
    cell_length_mm: Optional[int] = None
    cell_width_mm: Optional[int] = None
    cell_height_mm: Optional[int] = None
    birds_per_cell: Optional[int] = None
    tiers_per_set: Optional[int] = None
    cells_per_set: Optional[int] = None
    current_birds: Optional[int] = 0
    mortality_last_7d: Optional[int] = 0
    block_name: Optional[str] = None

    class Config:
        from_attributes = True


# ===== Egg Schemas =====

class EggInventoryUpdate(BaseModel):
    good_eggs: Optional[int] = None
    damaged_eggs: Optional[int] = None
    small_eggs: Optional[int] = None
    double_yolk_eggs: Optional[int] = None
    soft_shell_eggs: Optional[int] = None
    shells: Optional[int] = None


class EggInventoryResponse(BaseModel):
    id: int
    farm_id: int
    good_eggs: int
    damaged_eggs: int
    small_eggs: int
    double_yolk_eggs: int
    soft_shell_eggs: int
    shells: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TraySaleCreate(BaseModel):
    tray_id: int
    quantity: int
    price_per_tray: float
    buyer_name: str
    notes: Optional[str] = None


class TraySaleResponse(BaseModel):
    id: int
    tray_id: int
    quantity: int
    price_per_tray: float
    total_price: float
    buyer_name: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Feed Schemas =====

class FeedInventoryUpdate(BaseModel):
    quantity_kg: Optional[float] = None
    cost_per_kg: Optional[float] = None


class FeedInventoryResponse(BaseModel):
    id: int
    farm_id: int
    feed_type: str
    quantity_kg: float
    cost_per_kg: float
    supplier: Optional[str] = None
    expiry_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeedIngredientCreate(BaseModel):
    name: str
    nutritional_value: Optional[float] = None
    cost_per_kg: float


class FeedIngredientResponse(BaseModel):
    id: int
    farm_id: int
    name: str
    nutritional_value: Optional[float] = None
    cost_per_kg: float
    created_at: datetime

    class Config:
        from_attributes = True


class FeedMixItemResponse(BaseModel):
    id: int
    feed_mix_id: int
    ingredient_id: int
    quantity_kg: float
    nutritional_contribution: Optional[float] = None

    class Config:
        from_attributes = True


class FeedMixCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_nutrition: Optional[float] = None


class FeedMixResponse(BaseModel):
    id: int
    farm_id: int
    name: str
    description: Optional[str] = None
    target_nutrition: Optional[float] = None
    created_at: datetime
    items: List[FeedMixItemResponse] = []

    class Config:
        from_attributes = True


# ===== Tray Schemas =====

class TrayInventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    condition: Optional[str] = None


class TrayInventoryResponse(BaseModel):
    id: int
    farm_id: int
    quantity: int
    condition: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Payment Schemas =====

class PaymentResponse(BaseModel):
    id: int
    farm_id: int
    amount: float
    status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Subscription Schemas =====

class SubscriptionStatus(BaseModel):
    plan: str
    status: str
    trial_used: Optional[bool] = None
    trial_start: Optional[date] = None
    trial_end: Optional[date] = None
    subscription_expires: Optional[date] = None
    is_active: bool

    class Config:
        from_attributes = True


# ===== Notification Schemas =====

class NotificationCreate(BaseModel):
    title: str
    message: str
    notification_type: str
    recipient_id: Optional[int] = None


class NotificationResponse(BaseModel):
    id: int
    farm_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Alert Schemas =====

class AlertResponse(BaseModel):
    id: int
    farm_id: int
    alert_type: str
    message: str
    severity: str
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Dashboard Schemas =====

class DashboardMetrics(BaseModel):
    total_pens: int
    total_birds: int
    average_occupancy: float
    total_eggs: int
    total_feed_used: float
    total_eggs_today: int
    feed_consumption_today: float
    mortality_today: int
    avg_egg_quality: float


class PenPerformance(BaseModel):
    pen_id: int
    pen_name: str
    total_eggs: int
    mortality_rate: float
    feed_efficiency: float
    egg_quality: float


class TrendData(BaseModel):
    date: date
    value: float
    metric_type: str


# ===== Farm Schemas =====

class FarmCreate(BaseModel):
    name: str
    owner_id: int
    plan: Optional[str] = "free_trial"
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    subscription_expires: Optional[datetime] = None


class FarmResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    plan: str
    is_active: bool
    trial_used: bool
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    subscription_expires: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None
    trial_used: Optional[bool] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    subscription_expires: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None