from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

SERVICES = ["EC2", "RDS", "EKS", "S3", "CloudFront", "Lambda", "VPC", "Route53", "ElastiCache", "OpenSearch"]


def _mock_daily_costs(days: int = 30):
    base = {s: random.uniform(50, 800) for s in SERVICES}
    result = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=days - i)).strftime("%Y-%m-%d")
        day_costs = {s: round(base[s] * random.uniform(0.85, 1.15), 2) for s in SERVICES}
        result.append({"date": date, "total": round(sum(day_costs.values()), 2), **day_costs})
    return result


@router.get("/summary")
async def cost_summary(current_user: User = Depends(get_current_user)):
    daily = _mock_daily_costs(30)
    total = sum(d["total"] for d in daily)
    prev_total = total * random.uniform(0.85, 1.10)
    return {
        "total_mtd": round(total, 2),
        "currency": "USD",
        "mom_change_pct": round((total - prev_total) / prev_total * 100, 1),
        "forecast_eom": round(total * 1.05, 2),
        "top_service": max(SERVICES, key=lambda s: sum(d.get(s, 0) for d in daily)),
    }


@router.get("/by-service")
async def cost_by_service(current_user: User = Depends(get_current_user)):
    daily = _mock_daily_costs(30)
    by_service = {}
    for d in daily:
        for s in SERVICES:
            by_service[s] = round(by_service.get(s, 0) + d.get(s, 0), 2)
    return [{"service": k, "amount": v} for k, v in sorted(by_service.items(), key=lambda x: -x[1])]


@router.get("/trend")
async def cost_trend(days: int = 30, current_user: User = Depends(get_current_user)):
    return _mock_daily_costs(days)


@router.get("/anomalies")
async def cost_anomalies(current_user: User = Depends(get_current_user)):
    return [
        {
            "id": 1,
            "service": "EC2",
            "expected": 450.00,
            "actual": 892.50,
            "deviation_pct": 98.3,
            "detected_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
        },
        {
            "id": 2,
            "service": "RDS",
            "expected": 120.00,
            "actual": 198.40,
            "deviation_pct": 65.3,
            "detected_at": (datetime.utcnow() - timedelta(hours=18)).isoformat(),
        },
    ]
