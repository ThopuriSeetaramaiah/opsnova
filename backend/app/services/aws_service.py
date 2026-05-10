from typing import Optional
import boto3
from botocore.exceptions import ClientError


class AWSService:
    def __init__(self, role_arn: str, external_id: Optional[str] = None):
        self.role_arn = role_arn
        self.external_id = external_id
        self._session = None

    async def assume_role(self):
        sts = boto3.client("sts")
        kwargs = {
            "RoleArn": self.role_arn,
            "RoleSessionName": "OpsNovaSession",
        }
        if self.external_id:
            kwargs["ExternalId"] = self.external_id
        response = sts.assume_role(**kwargs)
        creds = response["Credentials"]
        self._session = boto3.Session(
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"],
        )
        return self._session

    def _client(self, service: str, region: str = "us-east-1"):
        if not self._session:
            raise RuntimeError("Call assume_role() first")
        return self._session.client(service, region_name=region)

    def list_ec2_instances(self, region: str = "us-east-1") -> list:
        ec2 = self._client("ec2", region)
        response = ec2.describe_instances()
        instances = []
        for reservation in response["Reservations"]:
            for inst in reservation["Instances"]:
                instances.append({
                    "instance_id": inst["InstanceId"],
                    "instance_type": inst["InstanceType"],
                    "state": inst["State"]["Name"],
                    "region": region,
                    "tags": {t["Key"]: t["Value"] for t in inst.get("Tags", [])},
                })
        return instances

    def list_rds_instances(self, region: str = "us-east-1") -> list:
        rds = self._client("rds", region)
        response = rds.describe_db_instances()
        return [
            {
                "db_instance_id": db["DBInstanceIdentifier"],
                "engine": db["Engine"],
                "instance_class": db["DBInstanceClass"],
                "status": db["DBInstanceStatus"],
                "region": region,
            }
            for db in response["DBInstances"]
        ]

    def list_eks_clusters(self, region: str = "us-east-1") -> list:
        eks = self._client("eks", region)
        names = eks.list_clusters()["clusters"]
        clusters = []
        for name in names:
            detail = eks.describe_cluster(name=name)["cluster"]
            clusters.append({
                "name": name,
                "version": detail["version"],
                "status": detail["status"],
                "region": region,
            })
        return clusters

    def list_vpcs(self, region: str = "us-east-1") -> list:
        ec2 = self._client("ec2", region)
        response = ec2.describe_vpcs()
        return [
            {
                "vpc_id": vpc["VpcId"],
                "cidr": vpc["CidrBlock"],
                "is_default": vpc["IsDefault"],
                "region": region,
            }
            for vpc in response["Vpcs"]
        ]

    def get_cloudwatch_metrics(self, namespace: str, metric_name: str, region: str = "us-east-1") -> list:
        cw = self._client("cloudwatch", region)
        response = cw.list_metrics(Namespace=namespace, MetricName=metric_name)
        return response.get("Metrics", [])
