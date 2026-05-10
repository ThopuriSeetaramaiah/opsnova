from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.alert import Alert, AlertStatus

router = APIRouter()


@router.get("")
async def list_alerts(
    severity: str = None,
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Alert).where(Alert.tenant_id == current_user.tenant_id)
    if severity:
        query = query.where(Alert.severity == severity)
    if status:
        query = query.where(Alert.status == status)
    result = await db.execute(query.order_by(Alert.created_at.desc()))
    alerts = result.scalars().all()
    return [
        {
            "id": a.id,
            "severity": a.severity,
            "title": a.title,
            "description": a.description,
            "resource_id": a.resource_id,
            "status": a.status,
            "created_at": a.created_at,
            "resolved_at": a.resolved_at,
        }
        for a in alerts
    ]


@router.get("/summary")
async def alert_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert.severity, func.count(Alert.id))
        .where(Alert.tenant_id == current_user.tenant_id, Alert.status == AlertStatus.open)
        .group_by(Alert.severity)
    )
    counts = {row[0]: row[1] for row in result.all()}
    return {
        "critical": counts.get("critical", 0),
        "warning": counts.get("warning", 0),
        "info": counts.get("info", 0),
        "total_open": sum(counts.values()),
    }


@router.patch("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id,
            Alert.tenant_id == current_user.tenant_id,
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.resolved
    alert.resolved_at = datetime.utcnow()
    return {"id": alert_id, "status": "resolved"}
