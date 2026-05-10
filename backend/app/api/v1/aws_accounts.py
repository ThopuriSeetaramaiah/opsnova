from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.aws_account import AWSAccount, AccountStatus
from app.services.aws_service import AWSService

router = APIRouter()


class AddAccountRequest(BaseModel):
    account_id: str
    account_name: str
    role_arn: str
    external_id: Optional[str] = None
    regions: List[str] = ["us-east-1"]


@router.get("/accounts")
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AWSAccount).where(AWSAccount.tenant_id == current_user.tenant_id)
    )
    accounts = result.scalars().all()
    return [
        {
            "id": a.id,
            "account_id": a.account_id,
            "account_name": a.account_name,
            "role_arn": a.role_arn,
            "regions": a.regions,
            "status": a.status,
            "last_synced": a.last_synced,
            "created_at": a.created_at,
        }
        for a in accounts
    ]


@router.post("/accounts", status_code=201)
async def add_account(
    body: AddAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = AWSAccount(
        tenant_id=current_user.tenant_id,
        account_id=body.account_id,
        account_name=body.account_name,
        role_arn=body.role_arn,
        external_id=body.external_id,
        regions=body.regions,
        status=AccountStatus.pending,
    )
    db.add(account)
    await db.flush()
    return {"id": account.id, "message": "Account added. Run sync to collect inventory."}


@router.post("/accounts/{account_id}/sync")
async def sync_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AWSAccount).where(
            AWSAccount.id == account_id,
            AWSAccount.tenant_id == current_user.tenant_id,
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.status = AccountStatus.syncing
    await db.flush()

    try:
        svc = AWSService(account.role_arn, account.external_id)
        await svc.assume_role()
        account.status = AccountStatus.active
        account.last_synced = datetime.utcnow()
    except Exception as e:
        account.status = AccountStatus.error

    return {"status": account.status, "last_synced": account.last_synced}


@router.get("/accounts/{account_id}/inventory")
async def get_inventory(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Return mock inventory for demo
    return {
        "ec2_instances": 12,
        "rds_instances": 3,
        "eks_clusters": 2,
        "vpcs": 4,
        "load_balancers": 5,
        "s3_buckets": 18,
    }


@router.delete("/accounts/{account_id}", status_code=204)
async def delete_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AWSAccount).where(
            AWSAccount.id == account_id,
            AWSAccount.tenant_id == current_user.tenant_id,
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    await db.delete(account)
