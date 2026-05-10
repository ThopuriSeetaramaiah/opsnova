from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/clusters")
async def list_clusters(current_user: User = Depends(get_current_user)):
    return [
        {
            "id": "cluster-1",
            "name": "opsnova-prod",
            "version": "1.29",
            "region": "us-east-1",
            "status": "ACTIVE",
            "node_count": 6,
            "cpu_utilization": 62.4,
            "memory_utilization": 71.8,
            "pod_count": 48,
        },
        {
            "id": "cluster-2",
            "name": "opsnova-staging",
            "version": "1.28",
            "region": "us-west-2",
            "status": "ACTIVE",
            "node_count": 3,
            "cpu_utilization": 34.1,
            "memory_utilization": 45.2,
            "pod_count": 22,
        },
    ]


@router.get("/clusters/{cluster_id}/nodes")
async def list_nodes(cluster_id: str, current_user: User = Depends(get_current_user)):
    return [
        {
            "name": f"node-{i}",
            "status": "Ready",
            "instance_type": "m5.xlarge",
            "cpu_capacity": "4",
            "memory_capacity": "16Gi",
            "cpu_utilization": round(40 + i * 8.5, 1),
            "memory_utilization": round(50 + i * 5.2, 1),
            "pod_count": 8 + i,
        }
        for i in range(1, 4)
    ]


@router.get("/clusters/{cluster_id}/pods")
async def list_pods(cluster_id: str, current_user: User = Depends(get_current_user)):
    namespaces = ["default", "kube-system", "monitoring", "opsnova"]
    statuses = ["Running", "Running", "Running", "Pending", "Running"]
    return [
        {
            "name": f"pod-{ns}-{i}",
            "namespace": ns,
            "status": statuses[i % len(statuses)],
            "restarts": i % 3,
            "cpu_request": "100m",
            "memory_request": "128Mi",
        }
        for ns in namespaces
        for i in range(1, 4)
    ]


@router.get("/clusters/{cluster_id}/metrics")
async def cluster_metrics(cluster_id: str, current_user: User = Depends(get_current_user)):
    return {
        "cpu_utilization": 62.4,
        "memory_utilization": 71.8,
        "pod_count": {"running": 44, "pending": 3, "failed": 1},
        "namespace_breakdown": [
            {"namespace": "default", "pods": 12, "cpu": "1.2", "memory": "2.4Gi"},
            {"namespace": "kube-system", "pods": 8, "cpu": "0.4", "memory": "512Mi"},
            {"namespace": "monitoring", "pods": 6, "cpu": "0.8", "memory": "1.6Gi"},
            {"namespace": "opsnova", "pods": 22, "cpu": "2.2", "memory": "4.8Gi"},
        ],
    }
