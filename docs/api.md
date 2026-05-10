# OpsNova API Reference

Base URL: `http://localhost:8000/api/v1`

Interactive docs: `http://localhost:8000/docs`

---

## Authentication

### POST /auth/login
```json
// Request
{ "email": "admin@opsnova.io", "password": "Admin123!" }

// Response
{ "access_token": "eyJ...", "token_type": "bearer" }
```

### GET /auth/me
```
Authorization: Bearer <token>
```

---

## AWS Accounts

### GET /aws/accounts
Returns all AWS accounts for the tenant.

### POST /aws/accounts
```json
{
  "account_id": "123456789012",
  "account_name": "Production",
  "role_arn": "arn:aws:iam::123456789012:role/OpsNovaRole",
  "external_id": "optional",
  "regions": ["us-east-1", "us-west-2"]
}
```

### POST /aws/accounts/{id}/sync
Triggers inventory sync via IAM AssumeRole.

### GET /aws/accounts/{id}/inventory
Returns resource counts: EC2, RDS, EKS, VPCs, Load Balancers.

---

## Cost Analytics

### GET /costs/summary
Returns MTD cost, MoM change, forecast.

### GET /costs/by-service
Returns cost breakdown by AWS service.

### GET /costs/trend?days=30
Returns daily cost data for the last N days.

### GET /costs/anomalies
Returns detected cost anomalies.

---

## Kubernetes

### GET /kubernetes/clusters
### GET /kubernetes/clusters/{id}/nodes
### GET /kubernetes/clusters/{id}/pods
### GET /kubernetes/clusters/{id}/metrics

---

## Recommendations

### GET /recommendations?category=cost
### POST /recommendations/generate
Calls OpenAI to generate AI recommendations.

### PATCH /recommendations/{id}/status
```json
{ "status": "accepted" }  // accepted | dismissed
```

---

## Alerts

### GET /alerts?severity=critical&status=open
### GET /alerts/summary
### PATCH /alerts/{id}/resolve
