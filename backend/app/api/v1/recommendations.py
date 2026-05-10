from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.alert import Recommendation, RecommendationStatus
from app.services.ai_service import AIService

router = APIRouter()


class UpdateStatusRequest(BaseModel):
    status: RecommendationStatus


@router.get("")
async def list_recommendations(
    category: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Recommendation).where(Recommendation.tenant_id == current_user.tenant_id)
    if category:
        query = query.where(Recommendation.category == category)
    result = await db.execute(query.order_by(Recommendation.created_at.desc()))
    recs = result.scalars().all()
    return [
        {
            "id": r.id,
            "category": r.category,
            "title": r.title,
            "description": r.description,
            "estimated_savings": r.estimated_savings,
            "priority": r.priority,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in recs
    ]


@router.post("/generate")
async def generate_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ai = AIService()
    generated = await ai.generate_recommendations()

    saved = []
    for rec in generated:
        r = Recommendation(
            tenant_id=current_user.tenant_id,
            category=rec["category"],
            title=rec["title"],
            description=rec["description"],
            estimated_savings=rec.get("estimated_savings", 0),
            priority=rec.get("priority", "medium"),
        )
        db.add(r)
        saved.append(rec)

    await db.flush()
    return {"generated": len(saved), "recommendations": saved}


@router.patch("/{rec_id}/status")
async def update_status(
    rec_id: int,
    body: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == rec_id,
            Recommendation.tenant_id == current_user.tenant_id,
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = body.status
    return {"id": rec_id, "status": rec.status}
