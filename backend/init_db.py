#!/usr/bin/env python3
"""
SmartPoultry Database Initialization Script
============================================
Connects to the PostgreSQL database, creates all tables from SQLAlchemy
models, adds performance indexes, and seeds initial data.

Usage:
    python init_db.py                  # Full init (tables + indexes + seed)
    python init_db.py --tables-only    # Create tables and indexes only
    python init_db.py --seed-only      # Seed data only (tables must exist)
    python init_db.py --reset          # Drop all tables then re-create (DANGER)

Environment:
    DATABASE_URL  — PostgreSQL connection string (required)
    SECRET_KEY    — JWT signing secret (required for hashed admin password)
"""

import asyncio
import argparse
import logging
import os
import sys
from datetime import datetime, timezone, timedelta

# ---------------------------------------------------------------------------
# Ensure the backend/ directory is on the path so app.* imports resolve
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from urllib.parse import urlparse, urlunparse

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("init_db")

# ---------------------------------------------------------------------------
# Import app modules (after path is set)
# ---------------------------------------------------------------------------
try:
    from app.database import Base
    from app.models import (
        User, Farm, Block, Pen, ProductionRecord,
        EggInventory, FeedInventory, FeedIngredient, FeedMix, FeedMixItem,
        TrayInventory, TraySale, Notification, Alert, Payment, Environment,
        UserRole,
    )
    from app.auth import get_password_hash
except ImportError as exc:
    log.error("Failed to import app modules: %s", exc)
    log.error("Make sure you run this script from the backend/ directory.")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Database URL helpers
# ---------------------------------------------------------------------------

def build_engine_url(raw_url: str) -> str:
    """
    Normalise the DATABASE_URL for asyncpg:
      - Strip all query parameters (asyncpg does not accept sslmode=)
      - Ensure the postgresql+asyncpg:// scheme is used
    """
    parsed = urlparse(raw_url)
    parsed = parsed._replace(query="")
    if parsed.scheme.startswith("postgresql") and "+asyncpg" not in parsed.scheme:
        parsed = parsed._replace(scheme="postgresql+asyncpg")
    elif parsed.scheme == "postgres":
        parsed = parsed._replace(scheme="postgresql+asyncpg")
    return urlunparse(parsed)


def get_database_url() -> str:
    raw = os.environ.get("DATABASE_URL", "")
    if not raw:
        # Fallback for local development
        raw = "postgresql://postgres:password@localhost:5432/smartpoultry"
        log.warning("DATABASE_URL not set — using local fallback: %s", raw)
    return build_engine_url(raw)


# ---------------------------------------------------------------------------
# Extra performance indexes (beyond what SQLAlchemy auto-creates)
# ---------------------------------------------------------------------------

EXTRA_INDEXES = [
    # Production records — most common query patterns
    "CREATE INDEX IF NOT EXISTS idx_production_records_date "
    "ON production_records (date DESC);",

    "CREATE INDEX IF NOT EXISTS idx_production_records_farm_date "
    "ON production_records (farm_id, date DESC);",

    "CREATE INDEX IF NOT EXISTS idx_production_records_pen_date "
    "ON production_records (pen_id, date DESC);",

    # Environment readings
    "CREATE INDEX IF NOT EXISTS idx_environment_pen_date "
    "ON environment (pen_id, date DESC);",

    # Egg inventory by farm + date
    "CREATE INDEX IF NOT EXISTS idx_egg_inventory_farm_date "
    "ON egg_inventory (farm_id, date DESC);",

    # Feed inventory by farm
    "CREATE INDEX IF NOT EXISTS idx_feed_inventory_farm "
    "ON feed_inventory (farm_id);",

    # Tray inventory by farm + date
    "CREATE INDEX IF NOT EXISTS idx_tray_inventory_farm_date "
    "ON tray_inventory (farm_id, date DESC);",

    # Tray sales by farm + date
    "CREATE INDEX IF NOT EXISTS idx_tray_sales_farm_date "
    "ON tray_sales (farm_id, sale_date DESC);",

    # Notifications — unread lookup
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_read "
    "ON notifications (user_id, read);",

    # Alerts — unresolved lookup
    "CREATE INDEX IF NOT EXISTS idx_alerts_farm_resolved "
    "ON alerts (farm_id, is_resolved);",

    # Pens — active pens per farm
    "CREATE INDEX IF NOT EXISTS idx_pens_farm_status "
    "ON pens (farm_id, status);",

    # Users — google_id lookup
    "CREATE INDEX IF NOT EXISTS idx_users_google_id "
    "ON users (google_id) WHERE google_id IS NOT NULL;",

    # Feed ingredients per farm
    "CREATE INDEX IF NOT EXISTS idx_feed_ingredients_farm "
    "ON feed_ingredients (farm_id);",

    # Feed mixes per farm
    "CREATE INDEX IF NOT EXISTS idx_feed_mixes_farm_date "
    "ON feed_mixes (farm_id, mix_date DESC);",

    # Payments per farm
    "CREATE INDEX IF NOT EXISTS idx_payments_farm_date "
    "ON payments (farm_id, created_at DESC);",
]


# ---------------------------------------------------------------------------
# Audit-log trigger (optional, applied after tables exist)
# ---------------------------------------------------------------------------

AUDIT_TRIGGER_SQL = """
-- Audit log table (created only if it does not already exist)
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    table_name  TEXT        NOT NULL,
    operation   TEXT        NOT NULL,   -- INSERT / UPDATE / DELETE
    row_id      INTEGER,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by  TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_op
    ON audit_log (table_name, operation, changed_at DESC);

-- Generic trigger function
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, row_id, changed_at)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
        now()
    );
    RETURN NULL;
END;
$$;

-- Attach trigger to key tables (idempotent via DROP IF EXISTS)
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'production_records', 'pens', 'farms', 'users',
        'egg_inventory', 'feed_inventory', 'tray_sales'
    ] LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_audit_%1$s ON %1$s;
             CREATE TRIGGER trg_audit_%1$s
             AFTER INSERT OR UPDATE OR DELETE ON %1$s
             FOR EACH ROW EXECUTE FUNCTION fn_audit_log();',
            tbl
        );
    END LOOP;
END;
$$;
"""


# ---------------------------------------------------------------------------
# Seed data helpers
# ---------------------------------------------------------------------------

async def seed_data(session: AsyncSession) -> None:
    """Insert default admin user, demo farm, blocks, pens, and sample records."""
    from sqlalchemy import select

    log.info("Seeding initial data …")

    # ------------------------------------------------------------------
    # 1. Admin user
    # ------------------------------------------------------------------
    result = await session.execute(
        select(User).where(User.email == "admin@smartpoultry.com")
    )
    admin = result.scalar_one_or_none()

    if admin is None:
        admin = User(
            full_name="System Administrator",
            email="admin@smartpoultry.com",
            hashed_password=get_password_hash("Admin@1234!"),
            role=UserRole.ADMIN,
            is_active=True,
            contact="+1-000-000-0000",
            country="Kenya",
            city="Nairobi",
            bio="Default system administrator account.",
        )
        session.add(admin)
        await session.flush()
        log.info("  ✔ Admin user created  (email: admin@smartpoultry.com  password: Admin@1234!)")
    else:
        log.info("  – Admin user already exists, skipping.")

    # ------------------------------------------------------------------
    # 2. Demo farm
    # ------------------------------------------------------------------
    result = await session.execute(
        select(Farm).where(Farm.owner_id == admin.id)
    )
    farm = result.scalar_one_or_none()

    if farm is None:
        now = datetime.now(timezone.utc)
        farm = Farm(
            name="Green Valley Poultry Farm",
            owner_id=admin.id,
            plan="free_trial",
            is_active=True,
            trial_used=True,
            trial_start=now,
            trial_end=now + timedelta(days=30),
        )
        session.add(farm)
        await session.flush()

        # Link admin → farm
        admin.farm_id = farm.id
        log.info("  ✔ Demo farm created  (id: %d)", farm.id)
    else:
        log.info("  – Demo farm already exists (id: %d), skipping.", farm.id)

    # ------------------------------------------------------------------
    # 3. Blocks (housing sections)
    # ------------------------------------------------------------------
    result = await session.execute(
        select(Block).where(Block.farm_id == farm.id)
    )
    existing_blocks = result.scalars().all()
    existing_block_names = {b.name for b in existing_blocks}

    block_a = block_b = None
    for block_name in ("Block A", "Block B"):
        if block_name not in existing_block_names:
            blk = Block(name=block_name, farm_id=farm.id)
            session.add(blk)
            await session.flush()
            if block_name == "Block A":
                block_a = blk
            else:
                block_b = blk
            log.info("  ✔ %s created (id: %d)", block_name, blk.id)
        else:
            blk = next(b for b in existing_blocks if b.name == block_name)
            if block_name == "Block A":
                block_a = blk
            else:
                block_b = blk
            log.info("  – %s already exists, skipping.", block_name)

    # ------------------------------------------------------------------
    # 4. Pens
    # ------------------------------------------------------------------
    result = await session.execute(
        select(Pen).where(Pen.farm_id == farm.id)
    )
    existing_pens = result.scalars().all()
    existing_pen_names = {p.name for p in existing_pens}

    pen_defs = [
        dict(
            name="Pen A1",
            capacity=500,
            status="active",
            housing_system="deep_litter",
            breed="Lohmann Brown",
            batch_name="Batch-2024-01",
            source_hatchery="Kenchic Hatchery",
            initial_birds=500,
            current_birds=492,
            floor_area_sq_m=50.0,
            max_density=10.0,
            litter_type="wood_shavings",
            feeder_count=10,
            waterer_count=8,
            nest_count=25,
            block_id=block_a.id if block_a else None,
            start_date=datetime.now(timezone.utc) - timedelta(days=120),
        ),
        dict(
            name="Pen A2",
            capacity=500,
            status="active",
            housing_system="deep_litter",
            breed="Lohmann Brown",
            batch_name="Batch-2024-02",
            source_hatchery="Kenchic Hatchery",
            initial_birds=500,
            current_birds=488,
            floor_area_sq_m=50.0,
            max_density=10.0,
            litter_type="rice_husks",
            feeder_count=10,
            waterer_count=8,
            nest_count=25,
            block_id=block_a.id if block_a else None,
            start_date=datetime.now(timezone.utc) - timedelta(days=90),
        ),
        dict(
            name="Pen B1",
            capacity=300,
            status="active",
            housing_system="cage",
            breed="ISA Brown",
            batch_name="Batch-2024-03",
            source_hatchery="Sasso Hatchery",
            initial_birds=300,
            current_birds=297,
            cell_length_mm=450,
            cell_width_mm=500,
            cell_height_mm=400,
            birds_per_cell=4,
            tiers_per_set=3,
            cells_per_set=10,
            block_id=block_b.id if block_b else None,
            start_date=datetime.now(timezone.utc) - timedelta(days=60),
        ),
    ]

    created_pens = []
    for pdef in pen_defs:
        if pdef["name"] not in existing_pen_names:
            pen = Pen(farm_id=farm.id, user_id=admin.id, **pdef)
            session.add(pen)
            await session.flush()
            created_pens.append(pen)
            log.info("  ✔ %s created (id: %d)", pdef["name"], pen.id)
        else:
            pen = next(p for p in existing_pens if p.name == pdef["name"])
            created_pens.append(pen)
            log.info("  – %s already exists, skipping.", pdef["name"])

    # ------------------------------------------------------------------
    # 5. Sample production records (last 7 days for Pen A1)
    # ------------------------------------------------------------------
    pen_a1 = next((p for p in created_pens if p.name == "Pen A1"), None)
    if pen_a1:
        result = await session.execute(
            select(ProductionRecord).where(ProductionRecord.pen_id == pen_a1.id)
        )
        if not result.scalars().first():
            base_date = datetime.now(timezone.utc) - timedelta(days=7)
            for i in range(7):
                rec_date = base_date + timedelta(days=i)
                good = 440 + i * 2
                damaged = 3
                small = 2
                total = good + damaged + small
                rec = ProductionRecord(
                    date=rec_date,
                    pen_id=pen_a1.id,
                    farm_id=farm.id,
                    age_days=120 + i,
                    week_number=round((120 + i) / 7, 1),
                    opening_stock=pen_a1.current_birds,
                    closing_stock=pen_a1.current_birds,
                    mortality=0,
                    feed_kg=round(pen_a1.current_birds * 0.12, 1),
                    good_eggs=good,
                    damaged_eggs=damaged,
                    small_eggs=small,
                    double_yolk_eggs=0,
                    soft_shell_eggs=0,
                    shells=0,
                    broody_hen=0,
                    culls=0,
                    total_eggs=total,
                    hd_percentage=round(total / pen_a1.current_birds * 100, 2),
                    er_ratio=round(pen_a1.current_birds * 0.12 / total, 3) if total else 0,
                    recorded_by_id=admin.id,
                    staff_name=admin.full_name,
                )
                session.add(rec)
            log.info("  ✔ 7 sample production records created for Pen A1")
        else:
            log.info("  – Production records for Pen A1 already exist, skipping.")

    # ------------------------------------------------------------------
    # 6. Egg inventory snapshot
    # ------------------------------------------------------------------
    result = await session.execute(
        select(EggInventory).where(EggInventory.farm_id == farm.id)
    )
    if not result.scalars().first():
        egg_inv = EggInventory(
            farm_id=farm.id,
            date=datetime.now(timezone.utc),
            opening_stock=0,
            received=3080,
            sold=2800,
            rejects=42,
            breakages=18,
            closing_stock=220,
        )
        session.add(egg_inv)
        log.info("  ✔ Egg inventory snapshot created")
    else:
        log.info("  – Egg inventory already exists, skipping.")

    # ------------------------------------------------------------------
    # 7. Feed inventory
    # ------------------------------------------------------------------
    result = await session.execute(
        select(FeedInventory).where(FeedInventory.farm_id == farm.id)
    )
    if not result.scalars().first():
        for feed_type, opening, received, consumed in [
            ("Layer Mash",   500.0, 2000.0, 1800.0),
            ("Grower Mash",  200.0,  800.0,  750.0),
            ("Chick Mash",   100.0,  400.0,  380.0),
        ]:
            closing = opening + received - consumed
            session.add(FeedInventory(
                farm_id=farm.id,
                feed_type=feed_type,
                opening_stock=opening,
                received=received,
                consumed=consumed,
                closing_stock=closing,
            ))
        log.info("  ✔ Feed inventory records created")
    else:
        log.info("  – Feed inventory already exists, skipping.")

    # ------------------------------------------------------------------
    # 8. Feed ingredients + a sample mix
    # ------------------------------------------------------------------
    result = await session.execute(
        select(FeedIngredient).where(FeedIngredient.farm_id == farm.id)
    )
    if not result.scalars().first():
        ingredients_data = [
            ("Maize",           1200.0, 0.35),
            ("Soybean Meal",     400.0, 0.65),
            ("Limestone",        150.0, 0.08),
            ("Premix (Layer)",    50.0, 2.50),
            ("Salt",              20.0, 0.05),
        ]
        ingredients = []
        for name, stock, cost in ingredients_data:
            ing = FeedIngredient(
                farm_id=farm.id,
                name=name,
                stock_kg=stock,
                unit_cost=cost,
            )
            session.add(ing)
            ingredients.append(ing)
        await session.flush()

        # Sample feed mix
        mix = FeedMix(
            farm_id=farm.id,
            name="Standard Layer Mix",
            mix_date=datetime.now(timezone.utc) - timedelta(days=3),
            total_kg=100.0,
            cost_per_kg=0.42,
            created_by=admin.id,
        )
        session.add(mix)
        await session.flush()

        mix_items = [
            (ingredients[0], 60.0),   # Maize 60 kg
            (ingredients[1], 25.0),   # Soybean 25 kg
            (ingredients[2],  8.0),   # Limestone 8 kg
            (ingredients[3],  5.0),   # Premix 5 kg
            (ingredients[4],  2.0),   # Salt 2 kg
        ]
        for ing, qty in mix_items:
            session.add(FeedMixItem(
                mix_id=mix.id,
                ingredient_id=ing.id,
                quantity_kg=qty,
            ))
        log.info("  ✔ Feed ingredients and sample mix created")
    else:
        log.info("  – Feed ingredients already exist, skipping.")

    # ------------------------------------------------------------------
    # 9. Tray inventory
    # ------------------------------------------------------------------
    result = await session.execute(
        select(TrayInventory).where(TrayInventory.farm_id == farm.id)
    )
    if not result.scalars().first():
        session.add(TrayInventory(
            farm_id=farm.id,
            date=datetime.now(timezone.utc),
            opening_stock=50,
            received=200,
            sold=180,
            closing_stock=70,
        ))
        log.info("  ✔ Tray inventory created")
    else:
        log.info("  – Tray inventory already exists, skipping.")

    # ------------------------------------------------------------------
    # 10. Sample tray sale
    # ------------------------------------------------------------------
    result = await session.execute(
        select(TraySale).where(TraySale.farm_id == farm.id)
    )
    if not result.scalars().first():
        session.add(TraySale(
            farm_id=farm.id,
            customer_name="Nairobi Fresh Market",
            trays=50,
            price_per_tray=4.50,
            currency="USD",
            total_price=225.00,
            sale_date=datetime.now(timezone.utc) - timedelta(days=1),
            recorded_by_id=admin.id,
        ))
        log.info("  ✔ Sample tray sale created")
    else:
        log.info("  – Tray sales already exist, skipping.")

    # ------------------------------------------------------------------
    # 11. Welcome notification
    # ------------------------------------------------------------------
    result = await session.execute(
        select(Notification).where(Notification.farm_id == farm.id)
    )
    if not result.scalars().first():
        session.add(Notification(
            user_id=admin.id,
            farm_id=farm.id,
            message=(
                "Welcome to SmartPoultry! Your farm has been set up with demo data. "
                "Start by exploring the dashboard, then add your own pens and records."
            ),
            read=False,
        ))
        log.info("  ✔ Welcome notification created")
    else:
        log.info("  – Notifications already exist, skipping.")

    await session.commit()
    log.info("Seed data committed successfully.")


# ---------------------------------------------------------------------------
# Core init routines
# ---------------------------------------------------------------------------

async def create_tables(engine) -> None:
    log.info("Creating database tables …")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Tables created (or already exist).")


async def create_indexes(engine) -> None:
    log.info("Creating performance indexes …")
    async with engine.begin() as conn:
        for sql in EXTRA_INDEXES:
            try:
                await conn.execute(text(sql))
            except Exception as exc:
                log.warning("  Index skipped (%s): %s", exc.__class__.__name__, exc)
    log.info("Indexes applied.")


async def create_audit_triggers(engine) -> None:
    log.info("Applying audit-log triggers …")
    async with engine.begin() as conn:
        try:
            await conn.execute(text(AUDIT_TRIGGER_SQL))
            log.info("Audit triggers applied.")
        except Exception as exc:
            log.warning("Audit triggers skipped: %s", exc)


async def drop_all_tables(engine) -> None:
    log.warning("⚠️  Dropping ALL tables — this is irreversible!")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        # Also drop audit_log if it exists
        await conn.execute(text("DROP TABLE IF EXISTS audit_log CASCADE;"))
        await conn.execute(text("DROP FUNCTION IF EXISTS fn_audit_log CASCADE;"))
    log.warning("All tables dropped.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main(args: argparse.Namespace) -> None:
    db_url = get_database_url()
    log.info("Connecting to: %s", db_url.split("@")[-1])  # hide credentials

    engine = create_async_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        connect_args={"ssl": True},
    )

    try:
        if args.reset:
            await drop_all_tables(engine)

        if not args.seed_only:
            await create_tables(engine)
            await create_indexes(engine)
            await create_audit_triggers(engine)

        if not args.tables_only:
            SessionLocal = async_sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            async with SessionLocal() as session:
                await seed_data(session)

        log.info("✅  Database initialisation complete.")

    except Exception:
        log.exception("❌  Initialisation failed.")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="SmartPoultry database initialisation script"
    )
    parser.add_argument(
        "--tables-only",
        action="store_true",
        help="Create tables and indexes only; skip seeding",
    )
    parser.add_argument(
        "--seed-only",
        action="store_true",
        help="Run seed data only; skip table creation",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="DROP all tables before re-creating (DESTRUCTIVE)",
    )
    args = parser.parse_args()

    if args.tables_only and args.seed_only:
        parser.error("--tables-only and --seed-only are mutually exclusive.")

    asyncio.run(main(args))
