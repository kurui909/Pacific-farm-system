from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.responses import StreamingResponse
import io
import csv
from datetime import date, datetime
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

from app.database import get_db
from app.models import ProductionRecord, Pen, Farm
from app.dependencies import get_current_farm, require_active_subscription

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/csv")
async def export_csv(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    pen_id: Optional[int] = Query(None),
):
    """Export production records as CSV."""
    stmt = select(ProductionRecord).where(ProductionRecord.farm_id == farm.id)
    if start_date:
        stmt = stmt.where(ProductionRecord.date >= start_date)
    if end_date:
        stmt = stmt.where(ProductionRecord.date <= end_date)
    if pen_id:
        stmt = stmt.where(ProductionRecord.pen_id == pen_id)

    result = await db.execute(stmt.order_by(ProductionRecord.date))
    records = result.scalars().all()

    # Fetch pen names
    pen_ids = list(set(r.pen_id for r in records))
    pens_map = {}
    if pen_ids:
        pen_result = await db.execute(select(Pen).where(Pen.id.in_(pen_ids)))
        pens_map = {p.id: p.name for p in pen_result.scalars().all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Pen", "Opening Stock", "Closing Stock", "Mortality", "Feed (kg)",
                     "Good Eggs", "Damaged Eggs", "Small Eggs", "Double Yolk", "Soft Shell",
                     "Shells", "Broody Hen", "Culls", "Staff", "Total Eggs", "HD%", "E/R"])

    for rec in records:
        writer.writerow([
            rec.date.strftime("%Y-%m-%d"),
            pens_map.get(rec.pen_id, "Unknown"),
            rec.opening_stock,
            rec.closing_stock,
            rec.mortality or 0,
            rec.feed_kg or 0,
            rec.good_eggs or 0,
            rec.damaged_eggs or 0,
            rec.small_eggs or 0,
            rec.double_yolk_eggs or 0,
            rec.soft_shell_eggs or 0,
            rec.shells or 0,
            rec.broody_hen or 0,
            rec.culls or 0,
            rec.staff_name or "",
            rec.total_eggs or 0,
            f"{rec.hd_percentage:.1f}" if rec.hd_percentage else "",
            f"{rec.er_ratio:.2f}" if rec.er_ratio else "",
        ])

    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=production_{date.today()}.csv"
    return response


@router.get("/pdf")
async def export_pdf(
    db: AsyncSession = Depends(get_db),
    farm: Farm = Depends(get_current_farm),
    _: Farm = Depends(require_active_subscription),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    pen_id: Optional[int] = Query(None),
):
    """Export production records as PDF."""
    # Same query as CSV
    stmt = select(ProductionRecord).where(ProductionRecord.farm_id == farm.id)
    if start_date:
        stmt = stmt.where(ProductionRecord.date >= start_date)
    if end_date:
        stmt = stmt.where(ProductionRecord.date <= end_date)
    if pen_id:
        stmt = stmt.where(ProductionRecord.pen_id == pen_id)

    result = await db.execute(stmt.order_by(ProductionRecord.date))
    records = result.scalars().all()

    pen_ids = list(set(r.pen_id for r in records))
    pens_map = {}
    if pen_ids:
        pen_result = await db.execute(select(Pen).where(Pen.id.in_(pen_ids)))
        pens_map = {p.id: p.name for p in pen_result.scalars().all()}

    # Create PDF buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title = Paragraph(f"Production Report – {farm.name}", styles['Title'])
    elements.append(title)

    # Table data
    data = [["Date", "Pen", "Eggs", "Feed (kg)", "Mortality", "HD%", "E/R", "Staff"]]
    for rec in records:
        data.append([
            rec.date.strftime("%Y-%m-%d"),
            pens_map.get(rec.pen_id, "Unknown"),
            str(rec.total_eggs or 0),
            f"{rec.feed_kg:.1f}" if rec.feed_kg else "0",
            str(rec.mortality or 0),
            f"{rec.hd_percentage:.1f}%" if rec.hd_percentage else "0%",
            f"{rec.er_ratio:.2f}" if rec.er_ratio else "0",
            rec.staff_name or "",
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    response = StreamingResponse(buffer, media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=production_{date.today()}.pdf"
    return response