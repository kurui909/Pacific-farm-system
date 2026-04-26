from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Farm, Block, Pen
from app.schemas import BlockCreate, BlockUpdate, BlockResponse, BlockAssignment, BlockPenAction
from app.dependencies import get_current_farm, get_current_user

router = APIRouter(prefix="/blocks", tags=["blocks"])

@router.get("", response_model=List[BlockResponse])
async def get_blocks(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm)
):
    """Get all blocks for the current farm"""
    result = await db.execute(
        select(Block).where(Block.farm_id == farm.id).order_by(Block.created_at.desc())
    )
    blocks = result.scalars().all()
    
    # Convert to response format with proper field mapping
    response_blocks = []
    for block in blocks:
        response_blocks.append(BlockResponse(
            id=block.id,
            name=block.name,
            farm_id=block.farm_id,
            created_at=block.created_at,
            updated_at=block.updated_at
        ))
    
    return response_blocks

@router.get("/{block_id}", response_model=BlockResponse)
async def get_block(
    block_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm)
):
    """Get a specific block by ID"""
    result = await db.execute(
        select(Block).where(Block.id == block_id, Block.farm_id == farm.id)
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    return BlockResponse(
        id=block.id,
        name=block.name,
        farm_id=block.farm_id,
        created_at=block.created_at,
        updated_at=block.updated_at
    )

@router.post("", response_model=BlockResponse)
async def create_block(
    data: BlockCreate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm)
):
    """Create a new block"""
    # Check if block with same name exists
    existing = await db.execute(
        select(Block).where(Block.farm_id == farm.id, Block.name == data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Block with this name already exists")
    
    block = Block(
        name=data.name,
        farm_id=farm.id
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)
    
    return BlockResponse(
        id=block.id,
        name=block.name,
        farm_id=block.farm_id,
        created_at=block.created_at,
        updated_at=block.updated_at
    )

@router.put("/{block_id}", response_model=BlockResponse)
async def update_block(
    block_id: int,
    data: BlockUpdate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm)
):
    """Update a block"""
    result = await db.execute(
        select(Block).where(Block.id == block_id, Block.farm_id == farm.id)
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    if data.name is not None:
        block.name = data.name
    
    await db.commit()
    await db.refresh(block)
    
    return BlockResponse(
        id=block.id,
        name=block.name,
        farm_id=block.farm_id,
        created_at=block.created_at,
        updated_at=block.updated_at
    )

@router.delete("/{block_id}")
async def delete_block(
    block_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm)
):
    """Delete a block"""
    result = await db.execute(
        select(Block).where(Block.id == block_id, Block.farm_id == farm.id)
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Check if block has pens
    pens = await db.execute(
        select(Pen).where(Pen.block_id == block_id)
    )
    if pens.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete block with assigned pens")
    
    await db.delete(block)
    await db.commit()
    
    return {"message": "Block deleted successfully"}

@router.post("/{block_id}/assign-pens")
async def assign_pens_to_block(
    block_id: int,
    data: BlockAssignment,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm)
):
    """Assign pens to a block"""
    # Verify block exists
    block_result = await db.execute(
        select(Block).where(Block.id == block_id, Block.farm_id == farm.id)
    )
    block = block_result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Update pens
    for pen_id in data.pen_ids:
        pen_result = await db.execute(
            select(Pen).where(Pen.id == pen_id, Pen.farm_id == farm.id)
        )
        pen = pen_result.scalar_one_or_none()
        if pen:
            pen.block_id = block_id
    
    await db.commit()
    
    return {"message": f"Assigned {len(data.pen_ids)} pens to block {block.name}"}