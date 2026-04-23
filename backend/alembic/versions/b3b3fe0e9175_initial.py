"""initial

Revision ID: b3b3fe0e9175
Revises: 
Create Date: 2024-01-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b3b3fe0e9175'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table WITHOUT farm_id (to break cycle)
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('ADMIN', 'MANAGER', 'SUPERVISOR', 'EGG_KEEPER', 'FEED_KEEPER', 'CUSTOMER', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create farms table (can reference users now)
    op.create_table('farms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('stripe_customer_id', sa.String(), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(), nullable=True),
        sa.Column('plan', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('trial_used', sa.Boolean(), nullable=True),
        sa.Column('trial_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('subscription_expires', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_farms_id'), 'farms', ['id'], unique=False)

    # Create blocks table
    op.create_table('blocks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_blocks_farm_id'), 'blocks', ['farm_id'], unique=False)
    op.create_index(op.f('ix_blocks_id'), 'blocks', ['id'], unique=False)

    # Create egg_inventory table
    op.create_table('egg_inventory',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_eggs', sa.Integer(), nullable=False),
        sa.Column('good_eggs', sa.Integer(), nullable=False),
        sa.Column('bad_eggs', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create feed_ingredients table
    op.create_table('feed_ingredients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create feed_inventory table
    op.create_table('feed_inventory',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('ingredient_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('date_received', sa.Date(), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.ForeignKeyConstraint(['ingredient_id'], ['feed_ingredients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create feed_mixes table
    op.create_table('feed_mixes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create payments table
    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('stripe_payment_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create tray_inventory table
    op.create_table('tray_inventory',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('date_received', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create tray_sales table
    op.create_table('tray_sales',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('price_per_tray', sa.Float(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('sale_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create feed_mix_items table
    op.create_table('feed_mix_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('mix_id', sa.Integer(), nullable=False),
        sa.Column('ingredient_id', sa.Integer(), nullable=False),
        sa.Column('percentage', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['ingredient_id'], ['feed_ingredients.id'], ),
        sa.ForeignKeyConstraint(['mix_id'], ['feed_mixes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create pens table
    op.create_table('pens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('block_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('housing_system', sa.Enum('BATTERY_CAGES', 'FLOOR_SYSTEM', 'DEEP_LITTER', 'FREE_RANGE', name='housingsystem'), nullable=False),
        sa.Column('breed', sa.String(), nullable=True),
        sa.Column('age_weeks', sa.Integer(), nullable=True),
        sa.Column('initial_birds', sa.Integer(), nullable=False),
        sa.Column('current_birds', sa.Integer(), nullable=False),
        sa.Column('mortality', sa.Integer(), nullable=True),
        sa.Column('feed_system', sa.String(), nullable=True),
        sa.Column('water_system', sa.String(), nullable=True),
        sa.Column('ventilation_system', sa.String(), nullable=True),
        sa.Column('lighting_system', sa.String(), nullable=True),
        sa.Column('cage_rows', sa.Integer(), nullable=True),
        sa.Column('cage_columns', sa.Integer(), nullable=True),
        sa.Column('cages_per_cell', sa.Integer(), nullable=True),
        sa.Column('birds_per_cage', sa.Integer(), nullable=True),
        sa.Column('floor_area_sqft', sa.Float(), nullable=True),
        sa.Column('nests_count', sa.Integer(), nullable=True),
        sa.Column('perches_count', sa.Integer(), nullable=True),
        sa.Column('feeders_count', sa.Integer(), nullable=True),
        sa.Column('drinkers_count', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['block_id'], ['blocks.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pens_farm_id'), 'pens', ['farm_id'], unique=False)
    op.create_index(op.f('ix_pens_id'), 'pens', ['id'], unique=False)
    op.create_index(op.f('ix_pens_name'), 'pens', ['name'], unique=False)

    # Create alerts table
    op.create_table('alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('pen_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.ForeignKeyConstraint(['pen_id'], ['pens.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create environment table
    op.create_table('environment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pen_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('temperature_c', sa.Float(), nullable=True),
        sa.Column('humidity_percent', sa.Float(), nullable=True),
        sa.Column('ammonia_ppm', sa.Float(), nullable=True),
        sa.Column('co2_ppm', sa.Float(), nullable=True),
        sa.Column('light_intensity_lux', sa.Float(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['pen_id'], ['pens.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_environment_date'), 'environment', ['date'], unique=False)
    op.create_index(op.f('ix_environment_id'), 'environment', ['id'], unique=False)
    op.create_index(op.f('ix_environment_pen_id'), 'environment', ['pen_id'], unique=False)

    # Create production_records table
    op.create_table('production_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('pen_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('eggs_laid', sa.Integer(), nullable=False),
        sa.Column('eggs_collected', sa.Integer(), nullable=False),
        sa.Column('feed_consumed_kg', sa.Float(), nullable=True),
        sa.Column('water_consumed_liters', sa.Float(), nullable=True),
        sa.Column('mortality_count', sa.Integer(), nullable=True),
        sa.Column('recorded_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.ForeignKeyConstraint(['pen_id'], ['pens.id'], ),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_production_records_farm_id'), 'production_records', ['farm_id'], unique=False)
    op.create_index(op.f('ix_production_records_id'), 'production_records', ['id'], unique=False)
    op.create_index(op.f('ix_production_records_pen_id'), 'production_records', ['pen_id'], unique=False)

    # Add farm_id column to users (after farms table exists)
    op.add_column('users', sa.Column('farm_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_farm_id_farms', 'users', 'farms', ['farm_id'], ['id'])


def downgrade() -> None:
    # Remove farm_id column before dropping tables
    op.drop_constraint('fk_users_farm_id_farms', 'users', type_='foreignkey')
    op.drop_column('users', 'farm_id')

    # Drop tables in reverse order
    op.drop_index(op.f('ix_production_records_pen_id'), table_name='production_records')
    op.drop_index(op.f('ix_production_records_id'), table_name='production_records')
    op.drop_index(op.f('ix_production_records_farm_id'), table_name='production_records')
    op.drop_table('production_records')
    op.drop_index(op.f('ix_environment_pen_id'), table_name='environment')
    op.drop_index(op.f('ix_environment_id'), table_name='environment')
    op.drop_index(op.f('ix_environment_date'), table_name='environment')
    op.drop_table('environment')
    op.drop_table('alerts')
    op.drop_index(op.f('ix_pens_name'), table_name='pens')
    op.drop_index(op.f('ix_pens_id'), table_name='pens')
    op.drop_index(op.f('ix_pens_farm_id'), table_name='pens')
    op.drop_table('pens')
    op.drop_table('feed_mix_items')
    op.drop_table('tray_sales')
    op.drop_table('tray_inventory')
    op.drop_table('payments')
    op.drop_table('notifications')
    op.drop_table('feed_mixes')
    op.drop_table('feed_inventory')
    op.drop_table('feed_ingredients')
    op.drop_table('egg_inventory')
    op.drop_index(op.f('ix_blocks_id'), table_name='blocks')
    op.drop_index(op.f('ix_blocks_farm_id'), table_name='blocks')
    op.drop_table('blocks')
    op.drop_index(op.f('ix_farms_id'), table_name='farms')
    op.drop_table('farms')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')