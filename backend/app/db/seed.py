"""Seed database with default data for development."""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User, Tenant
from app.models.aws_account import AWSAccount, AccountStatus
from app.models.alert import Alert, Recommendation, SeverityEnum, AlertStatus


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(User).where(User.email == "admin@opsnova.io"))
        if result.scalar_one_or_none():
            print("Database already seeded.")
            return

        # Tenant
        tenant = Tenant(name="OpsNova Demo Org", slug="opsnova-demo", plan="enterprise")
        db.add(tenant)
        await db.flush()

        # Admin user
        admin = User(
            email="admin@opsnova.io",
            hashed_password=hash_password("Admin123!"),
            full_name="Admin User",
            role="admin",
            tenant_id=tenant.id,
        )
        db.add(admin)
        await db.flush()

        # AWS Accounts
        account1 = AWSAccount(
            tenant_id=tenant.id,
            account_id="123456789012",
            account_name="Production",
            role_arn="arn:aws:iam::123456789012:role/OpsNovaRole",
            regions=["us-east-1", "us-west-2"],
            status=AccountStatus.active,
        )
        account2 = AWSAccount(
            tenant_id=tenant.id,
            account_id="987654321098",
            account_name="Staging",
            role_arn="arn:aws:iam::987654321098:role/OpsNovaRole",
            regions=["us-east-1"],
            status=AccountStatus.active,
        )
        db.add_all([account1, account2])
        await db.flush()

        # Alerts
        alerts = [
            Alert(tenant_id=tenant.id, account_id=account1.id, severity=SeverityEnum.critical,
                  title="EC2 CPU utilization > 95%", description="Instance i-0abc123 CPU at 97% for 15 minutes",
                  resource_id="i-0abc123", status=AlertStatus.open),
            Alert(tenant_id=tenant.id, account_id=account1.id, severity=SeverityEnum.warning,
                  title="RDS storage > 80%", description="Database prod-db storage at 83%",
                  resource_id="prod-db", status=AlertStatus.open),
            Alert(tenant_id=tenant.id, account_id=account2.id, severity=SeverityEnum.info,
                  title="New IAM role created", description="IAM role OpsNovaRole created in staging account",
                  resource_id="OpsNovaRole", status=AlertStatus.open),
            Alert(tenant_id=tenant.id, account_id=account1.id, severity=SeverityEnum.warning,
                  title="Cost anomaly detected", description="EC2 costs 98% above expected",
                  resource_id="EC2", status=AlertStatus.open),
        ]
        db.add_all(alerts)

        # Recommendations
        recs = [
            Recommendation(tenant_id=tenant.id, account_id=account1.id, category="cost",
                           title="Right-size underutilized EC2 instances", estimated_savings=420.0, priority="high",
                           description="12 EC2 instances have average CPU utilization below 10%."),
            Recommendation(tenant_id=tenant.id, account_id=account1.id, category="cost",
                           title="Purchase Reserved Instances", estimated_savings=310.5, priority="high",
                           description="3 instances running 90+ days. Switch to Reserved Instances."),
            Recommendation(tenant_id=tenant.id, account_id=account1.id, category="security",
                           title="Restrict overly permissive security groups", estimated_savings=0.0, priority="high",
                           description="4 security groups allow 0.0.0.0/0 on non-standard ports."),
        ]
        db.add_all(recs)

        await db.commit()
        print("✅ Database seeded successfully!")
        print("   Login: admin@opsnova.io / Admin123!")


if __name__ == "__main__":
    asyncio.run(seed())
