from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, UniqueConstraint, func, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from typing import Optional, List
import enum

from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    SUPERVISOR = "supervisor"
    EGG_KEEPER = "egg_keeper"
    FEED_KEEPER = "feed_keeper"
    CUSTOMER = "customer"


class Farm(Base):
    __tablename__ = "farms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    stripe_customer_id = Column(String)
    stripe_subscription_id = Column(String)
    plan = Column(String, default="free_trial")
    is_active = Column(Boolean, default=False)
    trial_used = Column(Boolean, default=False)
    trial_start = Column(DateTime(timezone=True))
    trial_end = Column(DateTime(timezone=True))
    subscription_expires = Column(DateTime(timezone=True))

    owner = relationship("User", back_populates="owned_farm", uselist=False, foreign_keys="Farm.owner_id")
    users = relationship("User", back_populates="farm", foreign_keys="User.farm_id")
    pens = relationship("Pen", back_populates="farm", cascade="all, delete-orphan")
    blocks = relationship("Block", back_populates="farm", cascade="all, delete-orphan")
    production_records = relationship("ProductionRecord", back_populates="farm")
    egg_inventory = relationship("EggInventory", back_populates="farm")
    feed_inventory = relationship("FeedInventory", back_populates="farm")
    feed_ingredients = relationship("FeedIngredient", back_populates="farm")
    feed_mixes = relationship("FeedMix", back_populates="farm")
    tray_inventory = relationship("TrayInventory", back_populates="farm")
    tray_sales = relationship("TraySale", back_populates="farm")
    notifications = relationship("Notification", back_populates="farm")
    alerts = relationship("Alert", back_populates="farm")
    payments = relationship("Payment", back_populates="farm")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    contact = Column(String)
    profile_picture = Column(String)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    address = Column(String)
    city = Column(String)
    country = Column(String)
    bio = Column(Text)
    role = Column(Enum(UserRole), default=UserRole.ADMIN)
    is_active = Column(Boolean, default=True)
    google_id = Column(String, unique=True, nullable=True)
    reset_password_token = Column(String, unique=True, nullable=True)
    reset_password_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owned_farm = relationship("Farm", back_populates="owner", uselist=False, foreign_keys="Farm.owner_id")
    farm = relationship("Farm", back_populates="users", foreign_keys="User.farm_id")
    production_records = relationship("ProductionRecord", back_populates="recorded_by", foreign_keys="ProductionRecord.recorded_by_id")
    notifications = relationship("Notification", back_populates="user")
    tray_sales = relationship("TraySale", back_populates="recorded_by")
    feed_mixes = relationship("FeedMix", back_populates="created_by_user")


class Block(Base):
    __tablename__ = "blocks"
    __table_args__ = (UniqueConstraint("farm_id", "name", name="uq_block_farm_name"),)
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    farm = relationship("Farm", back_populates="blocks", foreign_keys="Block.farm_id")
    pens = relationship("Pen", back_populates="block_rel", foreign_keys="Pen.block_id")


class Pen(Base):
    __tablename__ = "pens"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    capacity = Column(Integer, nullable=False)
    status = Column(String, default="active")
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Housing system fields
    housing_system = Column(String, default="deep_litter")
    breed = Column(String, nullable=True)
    batch_name = Column(String, nullable=True)
    source_hatchery = Column(String, nullable=True)
    initial_birds = Column(Integer, nullable=True)
    birds_per_kg = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Deep Litter fields
    floor_area_sq_m = Column(Float, nullable=True)
    max_density = Column(Float, nullable=True)
    litter_type = Column(String, nullable=True)
    feeder_count = Column(Integer, nullable=True)
    waterer_count = Column(Integer, nullable=True)
    nest_count = Column(Integer, nullable=True)
    perch_length_cm = Column(Integer, nullable=True)
    
    # Cage system fields
    cell_length_mm = Column(Integer, nullable=True)
    cell_width_mm = Column(Integer, nullable=True)
    cell_height_mm = Column(Integer, nullable=True)
    birds_per_cell = Column(Integer, nullable=True)
    tiers_per_set = Column(Integer, nullable=True)
    cells_per_set = Column(Integer, nullable=True)
    
    # Production metrics
    current_birds = Column(Integer, default=0)
    mortality_last_7d = Column(Integer, default=0)
    
    # Relationships
    farm = relationship("Farm", back_populates="pens", foreign_keys="Pen.farm_id")
    user = relationship("User", foreign_keys="Pen.user_id")
    block_rel = relationship("Block", back_populates="pens", foreign_keys="Pen.block_id")
    production_records = relationship("ProductionRecord", back_populates="pen", cascade="all, delete-orphan", foreign_keys="ProductionRecord.pen_id")
    environment_records = relationship("Environment", back_populates="pen", cascade="all, delete-orphan", foreign_keys="Environment.pen_id")


class Environment(Base):
    __tablename__ = "environment"
    
    id = Column(Integer, primary_key=True, index=True)
    pen_id = Column(Integer, ForeignKey("pens.id"), nullable=False, index=True)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    ammonia = Column(Float, nullable=True)
    co2 = Column(Float, nullable=True)
    light_intensity = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    pen = relationship("Pen", back_populates="environment_records", foreign_keys="Environment.pen_id")


class ProductionRecord(Base):
    __tablename__ = "production_records"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    pen_id = Column(Integer, ForeignKey("pens.id"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    age_days = Column(Integer)
    week_number = Column(Float)
    opening_stock = Column(Integer, nullable=False)
    closing_stock = Column(Integer, nullable=False)
    mortality = Column(Integer)
    feed_kg = Column(Float)
    good_eggs = Column(Integer, default=0)
    damaged_eggs = Column(Integer, default=0)
    small_eggs = Column(Integer, default=0)
    double_yolk_eggs = Column(Integer, default=0)
    soft_shell_eggs = Column(Integer, default=0)
    shells = Column(Integer, default=0)
    broody_hen = Column(Integer, default=0)
    culls = Column(Integer, default=0)
    staff_name = Column(String)
    image_url = Column(String)
    total_eggs = Column(Integer)
    hd_percentage = Column(Float)
    er_ratio = Column(Float)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    pen = relationship("Pen", back_populates="production_records", foreign_keys="ProductionRecord.pen_id")
    farm = relationship("Farm", back_populates="production_records", foreign_keys="ProductionRecord.farm_id")
    recorded_by = relationship("User", back_populates="production_records", foreign_keys="ProductionRecord.recorded_by_id")


class EggInventory(Base):
    __tablename__ = "egg_inventory"
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=func.now())
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    opening_stock = Column(Integer, default=0)
    received = Column(Integer, default=0)
    sold = Column(Integer, default=0)
    rejects = Column(Integer, default=0)
    breakages = Column(Integer, default=0)
    closing_stock = Column(Integer, default=0)
    # ADDED MISSING FIELDS
    good_eggs = Column(Integer, default=0)
    damaged_eggs = Column(Integer, default=0)
    small_eggs = Column(Integer, default=0)
    double_yolk_eggs = Column(Integer, default=0)
    soft_shell_eggs = Column(Integer, default=0)
    shells = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    farm = relationship("Farm", back_populates="egg_inventory", foreign_keys="EggInventory.farm_id")


class FeedInventory(Base):
    __tablename__ = "feed_inventory"
    id = Column(Integer, primary_key=True)
    feed_type = Column(String, nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    opening_stock = Column(Float, default=0)
    received = Column(Float, default=0)
    consumed = Column(Float, default=0)
    closing_stock = Column(Float, default=0)
    farm = relationship("Farm", back_populates="feed_inventory", foreign_keys="FeedInventory.farm_id")


class FeedIngredient(Base):
    __tablename__ = "feed_ingredients"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String, nullable=False)
    stock_kg = Column(Float, default=0.0)
    unit_cost = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    farm = relationship("Farm", back_populates="feed_ingredients", foreign_keys="FeedIngredient.farm_id")
    mix_items = relationship("FeedMixItem", back_populates="ingredient", cascade="all, delete-orphan")


class FeedMix(Base):
    __tablename__ = "feed_mixes"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String, nullable=False)
    mix_date = Column(DateTime, nullable=False)
    total_kg = Column(Float, nullable=False)
    cost_per_kg = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    farm = relationship("Farm", back_populates="feed_mixes", foreign_keys="FeedMix.farm_id")
    created_by_user = relationship("User", back_populates="feed_mixes", foreign_keys="FeedMix.created_by")
    mix_items = relationship("FeedMixItem", back_populates="mix", cascade="all, delete-orphan")


class FeedMixItem(Base):
    __tablename__ = "feed_mix_items"
    id = Column(Integer, primary_key=True)
    mix_id = Column(Integer, ForeignKey("feed_mixes.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("feed_ingredients.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    mix = relationship("FeedMix", back_populates="mix_items", foreign_keys="FeedMixItem.mix_id")
    ingredient = relationship("FeedIngredient", back_populates="mix_items", foreign_keys="FeedMixItem.ingredient_id")


class TrayInventory(Base):
    __tablename__ = "tray_inventory"
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=func.now())
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    opening_stock = Column(Integer, default=0)
    received = Column(Integer, default=0)
    sold = Column(Integer, default=0)
    closing_stock = Column(Integer, default=0)
    # ADDED MISSING FIELDS
    quantity = Column(Integer, default=0)
    condition = Column(String, default="good")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    farm = relationship("Farm", back_populates="tray_inventory", foreign_keys="TrayInventory.farm_id")


class TraySale(Base):
    __tablename__ = "tray_sales"
    id = Column(Integer, primary_key=True)
    customer_name = Column(String, nullable=False)
    trays = Column(Integer, nullable=False)
    price_per_tray = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    total_price = Column(Float, nullable=False)
    sale_date = Column(DateTime, nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    farm = relationship("Farm", back_populates="tray_sales", foreign_keys="TraySale.farm_id")
    recorded_by = relationship("User", back_populates="tray_sales", foreign_keys="TraySale.recorded_by_id")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    message = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="notifications", foreign_keys="Notification.user_id")
    farm = relationship("Farm", back_populates="notifications", foreign_keys="Notification.farm_id")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True)
    type = Column(String)
    message = Column(Text)
    severity = Column(String)
    pen_id = Column(Integer, ForeignKey("pens.id"), nullable=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    farm = relationship("Farm", back_populates="alerts", foreign_keys="Alert.farm_id")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    amount = Column(Float)
    currency = Column(String, default="usd")
    payment_method = Column(String)
    status = Column(String)
    stripe_payment_intent_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    farm = relationship("Farm", back_populates="payments", foreign_keys="Payment.farm_id")