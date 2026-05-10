import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class AccountStatus(str, enum.Enum):
    active = "active"
    error = "error"
    syncing = "syncing"
    pending = "pending"


class AWSAccount(Base):
    __tablename__ = "aws_accounts"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    account_id = Column(String(20), nullable=False)
    account_name = Column(String(255), nullable=False)
    role_arn = Column(String(500), nullable=False)
    external_id = Column(String(255))
    regions = Column(JSON, default=["us-east-1"])
    status = Column(Enum(AccountStatus), default=AccountStatus.pending)
    last_synced = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="aws_accounts")
    resources = relationship("AWSResource", back_populates="account")


class AWSResource(Base):
    __tablename__ = "aws_resources"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("aws_accounts.id"), nullable=False)
    resource_type = Column(String(50), nullable=False)  # ec2, rds, eks, vpc, elb
    resource_id = Column(String(255), nullable=False)
    region = Column(String(50), nullable=False)
    name = Column(String(255))
    tags = Column(JSON, default={})
    metadata_ = Column("metadata", JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("AWSAccount", back_populates="resources")
