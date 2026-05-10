import json
from typing import List, Dict
from app.core.config import settings


class AIService:
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_recommendations(self) -> List[Dict]:
        if not self.client:
            return self._mock_recommendations()

        prompt = """You are a cloud cost optimization expert. Generate 5 actionable AWS cost and performance recommendations.
Return a JSON array with objects containing: category (cost|security|performance), title, description, estimated_savings (monthly USD float), priority (high|medium|low).
Focus on realistic AWS optimizations like rightsizing, reserved instances, unused resources, security groups, etc."""

        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("recommendations", self._mock_recommendations())

    async def analyze_cost_anomaly(self, service: str, expected: float, actual: float) -> str:
        if not self.client:
            return f"Cost anomaly detected for {service}: ${actual:.2f} vs expected ${expected:.2f}. Investigate recent deployments and scaling events."

        prompt = f"AWS {service} cost anomaly: expected ${expected:.2f}, actual ${actual:.2f} ({((actual-expected)/expected*100):.1f}% increase). Provide a brief 2-sentence analysis and recommended action."
        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content

    def _mock_recommendations(self) -> List[Dict]:
        return [
            {
                "category": "cost",
                "title": "Right-size underutilized EC2 instances",
                "description": "12 EC2 instances have average CPU utilization below 10%. Downsizing to the next smaller instance type could reduce costs significantly.",
                "estimated_savings": 420.00,
                "priority": "high",
            },
            {
                "category": "cost",
                "title": "Purchase Reserved Instances for stable workloads",
                "description": "3 EC2 instances have been running continuously for 90+ days. Switching to 1-year Reserved Instances would save up to 40%.",
                "estimated_savings": 310.50,
                "priority": "high",
            },
            {
                "category": "cost",
                "title": "Delete unattached EBS volumes",
                "description": "8 EBS volumes totaling 1.2TB are not attached to any instance and have been idle for 30+ days.",
                "estimated_savings": 96.00,
                "priority": "medium",
            },
            {
                "category": "security",
                "title": "Restrict overly permissive security groups",
                "description": "4 security groups allow inbound traffic from 0.0.0.0/0 on ports other than 80/443. This increases attack surface.",
                "estimated_savings": 0.0,
                "priority": "high",
            },
            {
                "category": "performance",
                "title": "Enable RDS Performance Insights",
                "description": "2 RDS instances do not have Performance Insights enabled. This makes it difficult to diagnose slow queries.",
                "estimated_savings": 0.0,
                "priority": "medium",
            },
        ]
