import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Float, Text
from app.core.database import Base


class SeverityEnum(str, enum.Enum):
    critical = "critical"
    warning = "warning"
    info = "info"


class AlertStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"
    acknowledged = "acknowledged"


class RecommendationStatus(str, enum.Enum):
    open = "open"
    accepted = "accepted"
    dismissed = "dismissed"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("aws_accounts.id"), nullable=True)
    severity = Column(Enum(SeverityEnum), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    resource_id = Column(String(255))
    status = Column(Enum(AlertStatus), default=AlertStatus.open)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("aws_accounts.id"), nullable=True)
    category = Column(String(50), nullable=False)  # cost, security, performance
    title = Column(String(500), nullable=False)
    description = Column(Text)
    estimated_savings = Column(Float, default=0.0)
    priority = Column(String(20), default="medium")  # high, medium, low
    status = Column(Enum(RecommendationStatus), default=RecommendationStatus.open)
    created_at = Column(DateTime, default=datetime.utcnow)
