module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = var.vpc_id
  subnet_ids = var.subnet_ids

  cluster_endpoint_public_access = true

  cluster_addons = {
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni    = { most_recent = true }
  }

  eks_managed_node_groups = {
    on_demand = {
      min_size       = 2
      max_size       = 6
      desired_size   = 3
      instance_types = ["m5.xlarge"]
      capacity_type  = "ON_DEMAND"
    }
    spot = {
      min_size       = 0
      max_size       = 4
      desired_size   = 1
      instance_types = ["m5.large", "m5.xlarge"]
      capacity_type  = "SPOT"
    }
  }

  tags = var.tags
}

variable "cluster_name" {}
variable "cluster_version" {}
variable "vpc_id" {}
variable "subnet_ids" { type = list(string) }
variable "environment" {}
variable "tags" { type = map(string) }

output "cluster_endpoint" { value = module.eks.cluster_endpoint }
output "cluster_name" { value = module.eks.cluster_name }
