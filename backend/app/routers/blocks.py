from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models import Block, Farm, Pen
from app.schemas import BlockCreate, BlockUpdate, BlockResponse
from app.dependencies import get_current_farm, require_active_subscription

router = APIRouter(prefix="/blocks", tags=["blocks"])

class AssignPensRequest(BaseModel):
    pen_ids: List[int]

@router.get("/", response_model=list[BlockResponse])
async def get_blocks(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
):
    result = await db.execute(
        select(Block).where(Block.farm_id == farm.id).order_by(Block.name)
    )
    blocks = result.scalars().all()
    return blocks

@router.post("/", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
async def create_block(
    block_data: BlockCreate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _ = Depends(require_active_subscription),
):
    existing = await db.execute(
        select(Block).where(Block.farm_id == farm.id, Block.name == block_data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Block with this name already exists")
    
    block = Block(name=block_data.name, farm_id=farm.id)
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return block

@router.put("/{block_id}", response_model=BlockResponse)
async def update_block(
    block_id: int,
    block_data: BlockUpdate,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _ = Depends(require_active_subscription),
):
    result = await db.execute(
        select(Block).where(Block.id == block_id, Block.farm_id == farm.id)
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    if block_data.name is not None:
        duplicate = await db.execute(
            select(Block).where(Block.farm_id == farm.id, Block.name == block_data.name, Block.id != block_id)
        )
        if duplicate.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Block name already exists")
        block.name = block_data.name
    
    await db.commit()
    await db.refresh(block)
    return block

@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(
    block_id: int,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _ = Depends(require_active_subscription),
):
    result = await db.execute(
        select(Block).where(Block.id == block_id, Block.farm_id == farm.id)
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    await db.execute(
        Pen.__table__.update().where(Pen.block_id == block_id).values(block_id=None)
    )
    await db.delete(block)
    await db.commit()

@router.post("/{block_id}/assign-pens", status_code=status.HTTP_200_OK)
async def assign_pens_to_block(
    block_id: int,
    request: AssignPensRequest,
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _ = Depends(require_active_subscription),
):
    pen_ids = request.pen_ids
    if not pen_ids:
        raise HTTPException(status_code=400, detail="No pen IDs provided")
    
    # Verify block exists
    block_result = await db.execute(
        select(Block).where(Block.id == block_id, Block.farm_id == farm.id)
    )
    if not block_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Verify each pen belongs to farm and is not already in another block? (optional)
    for pen_id in pen_ids:
        pen_result = await db.execute(
            select(Pen).where(Pen.id == pen_id, Pen.farm_id == farm.id)
        )
        if not pen_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Pen {pen_id} not found in this farm")
    
    # Assign pens
    await db.execute(
        Pen.__table__.update().where(Pen.id.in_(pen_ids)).values(block_id=block_id)
    )
    await db.commit()
    return {"message": f"{len(pen_ids)} pen(s) assigned to block"}