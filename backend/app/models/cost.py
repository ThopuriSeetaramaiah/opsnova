from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from app.core.database import Base


class CostRecord(Base):
    __tablename__ = "cost_records"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("aws_accounts.id"), nullable=False)
    service = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    usage_type = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)


class CostAnomaly(Base):
    __tablename__ = "cost_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("aws_accounts.id"), nullable=False)
    service = Column(String(100), nullable=False)
    expected = Column(Float, nullable=False)
    actual = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow)
