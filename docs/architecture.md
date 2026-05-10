# OpsNova Architecture

## System Architecture

```
                          ┌─────────────────────────────────────────────────┐
                          │                   AWS Cloud                      │
                          │                                                  │
  Users ──► CloudFront ──►│  ALB (Application Load Balancer)                │
                          │    │                                             │
                          │    ├──► EKS Cluster (opsnova-eks)               │
                          │    │      ├── Frontend Pods (React/Nginx)        │
                          │    │      └── Backend Pods (FastAPI)             │
                          │    │              │                              │
                          │    │              ├──► RDS PostgreSQL            │
                          │    │              ├──► ElastiCache Redis         │
                          │    │              ├──► OpenSearch                │
                          │    │              └──► AWS APIs                  │
                          │    │                    ├── CloudWatch           │
                          │    │                    ├── Cost Explorer        │
                          │    │                    └── STS AssumeRole       │
                          │    │                                             │
                          │    └──► Monitoring Stack                         │
                          │           ├── Prometheus                         │
                          │           └── Grafana                            │
                          └─────────────────────────────────────────────────┘
```

## Multi-Account AWS Integration

```
OpsNova Backend
      │
      │  STS AssumeRole (with ExternalID)
      ▼
Customer AWS Account 1 (Production)
  ├── EC2 Instances
  ├── RDS Databases
  ├── EKS Clusters
  ├── VPCs
  └── Cost Explorer

Customer AWS Account 2 (Staging)
  └── ...
```

## Deployment Flow

```
Developer pushes code
        │
        ▼
GitHub Actions CI
  ├── Lint & Test
  ├── Build Docker image
  ├── Push to ECR
  └── Helm upgrade → EKS
              │
              ▼
        Rolling Update
        (zero downtime)
```

## Data Flow

```
AWS Account ──► IAM AssumeRole ──► OpsNova Backend
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                           PostgreSQL  Redis     OpenAI API
                           (persist)  (cache)  (AI recs)
                              │
                              ▼
                         Frontend Dashboard
                         (React + Recharts)
```

## Security Model

- Tenant isolation via `tenant_id` on all resources
- JWT authentication (HS256)
- IAM ExternalID for cross-account role assumption
- All secrets in Kubernetes Secrets / AWS Secrets Manager
- TLS termination at ALB
- RDS encrypted at rest, in-transit
- ECR image scanning on push
- Trivy security scanning in CI
