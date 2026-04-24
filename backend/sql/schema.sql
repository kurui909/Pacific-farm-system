-- =============================================================================
-- SmartPoultry API — PostgreSQL Schema
-- =============================================================================
-- Idempotent: safe to run on a fresh database or re-run on an existing one.
-- All CREATE statements use IF NOT EXISTS; all indexes use IF NOT EXISTS.
--
-- Execution order matters — tables are created in dependency order so that
-- foreign-key references are always satisfied.
--
-- Usage:
--   psql "$DATABASE_URL" -f backend/sql/schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for ILIKE search

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE userrole AS ENUM (
        'admin', 'manager', 'supervisor', 'egg_keeper', 'feed_keeper', 'customer'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1. users
--    Created first (no FK dependencies).
--    farm_id FK is added after farms is created (see ALTER TABLE below).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                      SERIAL          PRIMARY KEY,
    full_name               VARCHAR         NOT NULL,
    email                   VARCHAR         NOT NULL,
    hashed_password         VARCHAR         NOT NULL,
    contact                 VARCHAR,
    profile_picture         VARCHAR,
    farm_id                 INTEGER,                        -- FK added below
    address                 VARCHAR,
    city                    VARCHAR,
    country                 VARCHAR,
    bio                     TEXT,
    role                    userrole        DEFAULT 'admin',
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    google_id               VARCHAR         UNIQUE,
    reset_password_token    VARCHAR         UNIQUE,
    reset_password_expires  TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ,

    CONSTRAINT uq_users_email UNIQUE (email)
);

COMMENT ON TABLE  users                         IS 'Application users — each user belongs to exactly one farm.';
COMMENT ON COLUMN users.role                    IS 'admin | manager | supervisor | egg_keeper | feed_keeper | customer';
COMMENT ON COLUMN users.hashed_password         IS 'Argon2 hash produced by passlib.';
COMMENT ON COLUMN users.reset_password_token    IS 'Single-use token for password-reset flow; NULL when not in use.';

-- ---------------------------------------------------------------------------
-- 2. farms
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farms (
    id                      SERIAL          PRIMARY KEY,
    name                    VARCHAR         NOT NULL,
    owner_id                INTEGER         NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- Stripe / subscription
    stripe_customer_id      VARCHAR,
    stripe_subscription_id  VARCHAR,
    plan                    VARCHAR         NOT NULL DEFAULT 'free_trial',
    is_active               BOOLEAN         NOT NULL DEFAULT FALSE,
    trial_used              BOOLEAN         NOT NULL DEFAULT FALSE,
    trial_start             TIMESTAMPTZ,
    trial_end               TIMESTAMPTZ,
    subscription_expires    TIMESTAMPTZ
);

COMMENT ON TABLE  farms                         IS 'Top-level tenant entity; every resource belongs to a farm.';
COMMENT ON COLUMN farms.plan                    IS 'free_trial | basic | professional | enterprise';
COMMENT ON COLUMN farms.is_active               IS 'TRUE when the farm has an active trial or paid subscription.';

-- ---------------------------------------------------------------------------
-- 3. Add farm_id FK on users (deferred because farms did not exist yet)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    ALTER TABLE users
        ADD CONSTRAINT fk_users_farm_id
        FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 4. blocks  (housing sections / zones within a farm)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
    id          SERIAL      PRIMARY KEY,
    name        VARCHAR     NOT NULL,
    farm_id     INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,

    CONSTRAINT uq_block_farm_name UNIQUE (farm_id, name)
);

COMMENT ON TABLE blocks IS 'Physical sections of a farm that group one or more pens.';

-- ---------------------------------------------------------------------------
-- 5. pens  (individual housing units)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pens (
    id                  SERIAL      PRIMARY KEY,
    name                VARCHAR     NOT NULL,
    capacity            INTEGER     NOT NULL CHECK (capacity > 0),
    status              VARCHAR     NOT NULL DEFAULT 'active',
    farm_id             INTEGER     NOT NULL REFERENCES farms  (id) ON DELETE CASCADE,
    user_id             INTEGER     NOT NULL REFERENCES users  (id) ON DELETE RESTRICT,
    block_id            INTEGER              REFERENCES blocks (id) ON DELETE SET NULL,
    start_date          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,

    -- General flock info
    housing_system      VARCHAR     NOT NULL DEFAULT 'deep_litter',
    breed               VARCHAR,
    batch_name          VARCHAR,
    source_hatchery     VARCHAR,
    initial_birds       INTEGER     CHECK (initial_birds >= 0),
    birds_per_kg        FLOAT,
    notes               TEXT,

    -- Deep-litter / floor system fields
    floor_area_sq_m     FLOAT       CHECK (floor_area_sq_m > 0),
    max_density         FLOAT       CHECK (max_density > 0),
    litter_type         VARCHAR,
    feeder_count        INTEGER     CHECK (feeder_count >= 0),
    waterer_count       INTEGER     CHECK (waterer_count >= 0),
    nest_count          INTEGER     CHECK (nest_count >= 0),
    perch_length_cm     INTEGER     CHECK (perch_length_cm >= 0),

    -- Cage / battery system fields
    cell_length_mm      INTEGER     CHECK (cell_length_mm > 0),
    cell_width_mm       INTEGER     CHECK (cell_width_mm > 0),
    cell_height_mm      INTEGER     CHECK (cell_height_mm > 0),
    birds_per_cell      INTEGER     CHECK (birds_per_cell > 0),
    tiers_per_set       INTEGER     CHECK (tiers_per_set > 0),
    cells_per_set       INTEGER     CHECK (cells_per_set > 0),

    -- Live production metrics (updated by triggers / app logic)
    current_birds       INTEGER     NOT NULL DEFAULT 0 CHECK (current_birds >= 0),
    mortality_last_7d   INTEGER     NOT NULL DEFAULT 0 CHECK (mortality_last_7d >= 0)
);

COMMENT ON TABLE  pens                  IS 'Individual housing units (pens, cages, runs) within a farm.';
COMMENT ON COLUMN pens.housing_system   IS 'deep_litter | cage | free_range | barn';
COMMENT ON COLUMN pens.status           IS 'active | inactive | quarantine | empty';

-- ---------------------------------------------------------------------------
-- 6. environment  (sensor / manual readings per pen)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environment (
    id              SERIAL      PRIMARY KEY,
    pen_id          INTEGER     NOT NULL REFERENCES pens (id) ON DELETE CASCADE,
    date            TIMESTAMP   NOT NULL DEFAULT now(),
    temperature     FLOAT       CHECK (temperature BETWEEN -10 AND 60),
    humidity        FLOAT       CHECK (humidity    BETWEEN   0 AND 100),
    ammonia         FLOAT       CHECK (ammonia     >= 0),
    co2             FLOAT       CHECK (co2         >= 0),
    light_intensity FLOAT       CHECK (light_intensity >= 0),
    notes           TEXT,
    created_at      TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP
);

COMMENT ON TABLE environment IS 'Environmental sensor readings (temperature, humidity, ammonia, CO₂, light).';

-- ---------------------------------------------------------------------------
-- 7. production_records  (daily egg production per pen)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_records (
    id                  SERIAL      PRIMARY KEY,
    date                TIMESTAMP   NOT NULL,
    pen_id              INTEGER     NOT NULL REFERENCES pens  (id) ON DELETE CASCADE,
    farm_id             INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    age_days            INTEGER     CHECK (age_days >= 0),
    week_number         FLOAT       CHECK (week_number >= 0),

    -- Flock counts
    opening_stock       INTEGER     NOT NULL CHECK (opening_stock >= 0),
    closing_stock       INTEGER     NOT NULL CHECK (closing_stock >= 0),
    mortality           INTEGER              CHECK (mortality >= 0),
    feed_kg             FLOAT                CHECK (feed_kg >= 0),

    -- Egg grades
    good_eggs           INTEGER     NOT NULL DEFAULT 0 CHECK (good_eggs >= 0),
    damaged_eggs        INTEGER     NOT NULL DEFAULT 0 CHECK (damaged_eggs >= 0),
    small_eggs          INTEGER     NOT NULL DEFAULT 0 CHECK (small_eggs >= 0),
    double_yolk_eggs    INTEGER     NOT NULL DEFAULT 0 CHECK (double_yolk_eggs >= 0),
    soft_shell_eggs     INTEGER     NOT NULL DEFAULT 0 CHECK (soft_shell_eggs >= 0),
    shells              INTEGER     NOT NULL DEFAULT 0 CHECK (shells >= 0),
    broody_hen          INTEGER     NOT NULL DEFAULT 0 CHECK (broody_hen >= 0),
    culls               INTEGER     NOT NULL DEFAULT 0 CHECK (culls >= 0),

    -- Computed / cached metrics
    total_eggs          INTEGER              CHECK (total_eggs >= 0),
    hd_percentage       FLOAT                CHECK (hd_percentage BETWEEN 0 AND 100),
    er_ratio            FLOAT                CHECK (er_ratio >= 0),

    -- Metadata
    staff_name          VARCHAR,
    image_url           VARCHAR,
    recorded_by_id      INTEGER     NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at          TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP
);

COMMENT ON TABLE  production_records                IS 'Daily egg-production records per pen.';
COMMENT ON COLUMN production_records.hd_percentage  IS 'Hen-Day percentage = (total_eggs / closing_stock) × 100.';
COMMENT ON COLUMN production_records.er_ratio       IS 'Egg-to-feed ratio = feed_kg / total_eggs.';

-- ---------------------------------------------------------------------------
-- 8. egg_inventory  (farm-level egg stock movements)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_inventory (
    id              SERIAL      PRIMARY KEY,
    date            TIMESTAMP            DEFAULT now(),
    farm_id         INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    opening_stock   INTEGER              DEFAULT 0 CHECK (opening_stock >= 0),
    received        INTEGER              DEFAULT 0 CHECK (received >= 0),
    sold            INTEGER              DEFAULT 0 CHECK (sold >= 0),
    rejects         INTEGER              DEFAULT 0 CHECK (rejects >= 0),
    breakages       INTEGER              DEFAULT 0 CHECK (breakages >= 0),
    closing_stock   INTEGER              DEFAULT 0 CHECK (closing_stock >= 0)
);

COMMENT ON TABLE egg_inventory IS 'Farm-level egg stock movements (received from pens, sold, rejected, broken).';

-- ---------------------------------------------------------------------------
-- 9. feed_inventory  (farm-level feed stock movements)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_inventory (
    id              SERIAL      PRIMARY KEY,
    feed_type       VARCHAR     NOT NULL,
    farm_id         INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    opening_stock   FLOAT                DEFAULT 0 CHECK (opening_stock >= 0),
    received        FLOAT                DEFAULT 0 CHECK (received >= 0),
    consumed        FLOAT                DEFAULT 0 CHECK (consumed >= 0),
    closing_stock   FLOAT                DEFAULT 0 CHECK (closing_stock >= 0)
);

COMMENT ON TABLE  feed_inventory            IS 'Farm-level feed stock movements per feed type.';
COMMENT ON COLUMN feed_inventory.feed_type  IS 'e.g. Layer Mash, Grower Mash, Chick Mash.';

-- ---------------------------------------------------------------------------
-- 10. feed_ingredients  (raw materials used in custom feed mixes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_ingredients (
    id          SERIAL      PRIMARY KEY,
    farm_id     INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    name        VARCHAR     NOT NULL,
    stock_kg    FLOAT                DEFAULT 0.0 CHECK (stock_kg >= 0),
    unit_cost   FLOAT                DEFAULT 0.0 CHECK (unit_cost >= 0),
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

COMMENT ON TABLE feed_ingredients IS 'Raw feed ingredients available on a farm for custom mixing.';

-- ---------------------------------------------------------------------------
-- 11. feed_mixes  (custom feed formulations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_mixes (
    id          SERIAL      PRIMARY KEY,
    farm_id     INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    name        VARCHAR     NOT NULL,
    mix_date    TIMESTAMP   NOT NULL,
    total_kg    FLOAT       NOT NULL CHECK (total_kg > 0),
    cost_per_kg FLOAT       NOT NULL CHECK (cost_per_kg >= 0),
    created_by  INTEGER              REFERENCES users (id) ON DELETE SET NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

COMMENT ON TABLE feed_mixes IS 'Custom feed formulations produced on the farm.';

-- ---------------------------------------------------------------------------
-- 12. feed_mix_items  (ingredients within a feed mix)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_mix_items (
    id              SERIAL  PRIMARY KEY,
    mix_id          INTEGER NOT NULL REFERENCES feed_mixes       (id) ON DELETE CASCADE,
    ingredient_id   INTEGER NOT NULL REFERENCES feed_ingredients (id) ON DELETE RESTRICT,
    quantity_kg     FLOAT   NOT NULL CHECK (quantity_kg > 0)
);

COMMENT ON TABLE feed_mix_items IS 'Line items of a feed mix — each row is one ingredient and its quantity.';

-- ---------------------------------------------------------------------------
-- 13. tray_inventory  (egg-tray stock movements)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tray_inventory (
    id              SERIAL      PRIMARY KEY,
    date            TIMESTAMP            DEFAULT now(),
    farm_id         INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    opening_stock   INTEGER              DEFAULT 0 CHECK (opening_stock >= 0),
    received        INTEGER              DEFAULT 0 CHECK (received >= 0),
    sold            INTEGER              DEFAULT 0 CHECK (sold >= 0),
    closing_stock   INTEGER              DEFAULT 0 CHECK (closing_stock >= 0)
);

COMMENT ON TABLE tray_inventory IS 'Egg-tray stock movements (received, sold, closing balance).';

-- ---------------------------------------------------------------------------
-- 14. tray_sales  (individual tray sale transactions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tray_sales (
    id              SERIAL          PRIMARY KEY,
    customer_name   VARCHAR         NOT NULL,
    trays           INTEGER         NOT NULL CHECK (trays > 0),
    price_per_tray  FLOAT           NOT NULL CHECK (price_per_tray >= 0),
    currency        CHAR(3)         NOT NULL DEFAULT 'USD',
    total_price     FLOAT           NOT NULL CHECK (total_price >= 0),
    sale_date       TIMESTAMP       NOT NULL,
    farm_id         INTEGER         NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    recorded_by_id  INTEGER         NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at      TIMESTAMP       NOT NULL DEFAULT now()
);

COMMENT ON TABLE tray_sales IS 'Individual egg-tray sale transactions.';

-- ---------------------------------------------------------------------------
-- 15. notifications  (in-app user notifications)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id          SERIAL      PRIMARY KEY,
    user_id     INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    farm_id     INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    message     TEXT,
    read        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'In-app notifications delivered to individual users.';

-- ---------------------------------------------------------------------------
-- 16. alerts  (system-generated farm alerts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL          PRIMARY KEY,
    type        VARCHAR,
    message     TEXT,
    severity    VARCHAR,
    pen_id      INTEGER         REFERENCES pens  (id) ON DELETE SET NULL,
    farm_id     INTEGER         NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    is_resolved BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

COMMENT ON TABLE  alerts            IS 'System-generated alerts (high mortality, low feed, etc.).';
COMMENT ON COLUMN alerts.severity   IS 'info | warning | critical';
COMMENT ON COLUMN alerts.type       IS 'mortality | feed | environment | production | subscription';

-- ---------------------------------------------------------------------------
-- 17. payments  (subscription payment records)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id                          SERIAL      PRIMARY KEY,
    farm_id                     INTEGER     NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    amount                      FLOAT                CHECK (amount >= 0),
    currency                    VARCHAR              DEFAULT 'usd',
    payment_method              VARCHAR,
    status                      VARCHAR,
    stripe_payment_intent_id    VARCHAR,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  payments          IS 'Stripe payment records linked to farm subscriptions.';
COMMENT ON COLUMN payments.status   IS 'pending | succeeded | failed | refunded';

-- ---------------------------------------------------------------------------
-- 18. audit_log  (change history for key tables)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL   PRIMARY KEY,
    table_name  TEXT        NOT NULL,
    operation   TEXT        NOT NULL,   -- INSERT | UPDATE | DELETE
    row_id      INTEGER,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by  TEXT
);

COMMENT ON TABLE audit_log IS 'Append-only audit trail populated by database triggers.';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- users
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email       ON users (email);
CREATE        INDEX IF NOT EXISTS ix_users_id          ON users (id);
CREATE        INDEX IF NOT EXISTS idx_users_google_id  ON users (google_id) WHERE google_id IS NOT NULL;

-- farms
CREATE INDEX IF NOT EXISTS ix_farms_id ON farms (id);

-- blocks
CREATE INDEX IF NOT EXISTS ix_blocks_id      ON blocks (id);
CREATE INDEX IF NOT EXISTS ix_blocks_farm_id ON blocks (farm_id);

-- pens
CREATE INDEX IF NOT EXISTS ix_pens_id          ON pens (id);
CREATE INDEX IF NOT EXISTS ix_pens_name        ON pens (name);
CREATE INDEX IF NOT EXISTS ix_pens_farm_id     ON pens (farm_id);
CREATE INDEX IF NOT EXISTS idx_pens_farm_status ON pens (farm_id, status);

-- environment
CREATE INDEX IF NOT EXISTS ix_environment_id       ON environment (id);
CREATE INDEX IF NOT EXISTS ix_environment_pen_id   ON environment (pen_id);
CREATE INDEX IF NOT EXISTS ix_environment_date     ON environment (date DESC);
CREATE INDEX IF NOT EXISTS idx_environment_pen_date ON environment (pen_id, date DESC);

-- production_records
CREATE INDEX IF NOT EXISTS ix_production_records_id       ON production_records (id);
CREATE INDEX IF NOT EXISTS ix_production_records_pen_id   ON production_records (pen_id);
CREATE INDEX IF NOT EXISTS ix_production_records_farm_id  ON production_records (farm_id);
CREATE INDEX IF NOT EXISTS idx_production_records_date    ON production_records (date DESC);
CREATE INDEX IF NOT EXISTS idx_production_records_farm_date ON production_records (farm_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_production_records_pen_date  ON production_records (pen_id,  date DESC);

-- egg_inventory
CREATE INDEX IF NOT EXISTS idx_egg_inventory_farm_date ON egg_inventory (farm_id, date DESC);

-- feed_inventory
CREATE INDEX IF NOT EXISTS idx_feed_inventory_farm ON feed_inventory (farm_id);

-- feed_ingredients
CREATE INDEX IF NOT EXISTS idx_feed_ingredients_farm ON feed_ingredients (farm_id);

-- feed_mixes
CREATE INDEX IF NOT EXISTS idx_feed_mixes_farm_date ON feed_mixes (farm_id, mix_date DESC);

-- tray_inventory
CREATE INDEX IF NOT EXISTS idx_tray_inventory_farm_date ON tray_inventory (farm_id, date DESC);

-- tray_sales
CREATE INDEX IF NOT EXISTS idx_tray_sales_farm_date ON tray_sales (farm_id, sale_date DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read);

-- alerts
CREATE INDEX IF NOT EXISTS idx_alerts_farm_resolved ON alerts (farm_id, is_resolved);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_farm_date ON payments (farm_id, created_at DESC);

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_op ON audit_log (table_name, operation, changed_at DESC);

-- =============================================================================
-- TRIGGERS — audit logging
-- =============================================================================

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

-- Attach trigger to key tables (idempotent)
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

-- =============================================================================
-- TRIGGER — auto-update updated_at columns
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name   = 'updated_at'
          AND table_name   IN ('users','blocks','pens','environment','production_records')
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_set_updated_at_%1$s ON %1$s;
             CREATE TRIGGER trg_set_updated_at_%1$s
             BEFORE UPDATE ON %1$s
             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
            rec.table_name
        );
    END LOOP;
END;
$$;
