# OpsNova — AI-Powered Cloud Operations Intelligence Platform

OpsNova is a production-grade SaaS platform for DevOps and cloud teams to monitor AWS infrastructure, optimize costs, analyze Kubernetes clusters, and get AI-driven recommendations.

---

## Architecture

```
Users → CloudFront → ALB → EKS
                            ├── Frontend (React/Nginx)
                            └── Backend (FastAPI)
                                    ├── PostgreSQL (RDS)
                                    ├── Redis (ElastiCache)
                                    └── AWS APIs (via IAM AssumeRole)
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, TypeScript, TailwindCSS, Recharts     |
| Backend    | Python FastAPI, SQLAlchemy, Alembic             |
| Database   | PostgreSQL 15 (RDS), Redis (ElastiCache)        |
| Cloud      | AWS EKS, RDS, CloudWatch, Cost Explorer, Cognito|
| DevOps     | Docker, Kubernetes, Helm, Terraform             |
| AI         | OpenAI GPT-4, Amazon Bedrock                    |
| Monitoring | Prometheus, Grafana, OpenSearch                 |

---

## Quick Start (Local)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone and configure
```bash
git clone https://github.com/your-org/opsnova.git
cd opsnova
cp .env.example .env
# Edit .env with your values
```

### 2. Start all services
```bash
docker-compose up -d
```

### 3. Run database migrations & seed
```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.db.seed
```

### 4. Access
| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:3000       |
| Backend API| http://localhost:8000/docs  |
| Grafana    | http://localhost:3001       |
| Prometheus | http://localhost:9090       |

**Default credentials:** `admin@opsnova.io` / `Admin123!`

---

## Environment Variables

```env
# App
SECRET_KEY=your-secret-key-min-32-chars
APP_ENV=development

# Database
DATABASE_URL=postgresql+asyncpg://opsnova:opsnova@postgres:5432/opsnova

# Redis
REDIS_URL=redis://redis:6379/0

# AWS (optional for local dev)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1

# OpenAI
OPENAI_API_KEY=sk-...

# Cognito (optional)
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
```

---

## Project Structure

```
opsnova/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/v1/           # API route handlers
│   │   ├── core/             # Config, DB, security
│   │   ├── models/           # SQLAlchemy models
│   │   ├── services/         # Business logic
│   │   ├── db/               # Migrations, seed
│   │   └── mock_data/        # Mock AWS data
│   ├── alembic/              # DB migrations
│   └── Dockerfile
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── api/              # API client & endpoints
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts
│   │   ├── pages/            # Page components
│   │   └── hooks/            # Custom hooks
│   └── Dockerfile
├── terraform/                # AWS infrastructure
│   └── modules/              # EKS, RDS modules
├── helm/opsnova/             # Helm chart
├── k8s/                      # Kubernetes manifests
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # Architecture & API docs
```

---

## Deployment

### Terraform (AWS Infrastructure)
```bash
cd terraform
terraform init
terraform plan -var="db_password=YourSecurePass123"
terraform apply
```

### Helm (Kubernetes)
```bash
helm upgrade --install opsnova ./helm/opsnova \
  --namespace opsnova \
  --set image.tag=latest \
  --set secrets.dbPassword=YourSecurePass123
```

---

## CI/CD

GitHub Actions pipelines:
- **frontend.yml** — lint, test, build, push to ECR, deploy to EKS
- **backend.yml** — lint, test, security scan, push to ECR, deploy to EKS
- **terraform.yml** — fmt, validate, plan, apply

---

## API Documentation

Interactive docs available at `http://localhost:8000/docs` (Swagger UI).

See [docs/api.md](docs/api.md) for full reference.
