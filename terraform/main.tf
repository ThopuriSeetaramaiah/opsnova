terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket = "opsnova-terraform-state"
    key    = "opsnova/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.region
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "production"
  enable_dns_hostnames = true

  tags = local.tags
}

module "eks" {
  source = "./modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = var.eks_version
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  environment     = var.environment
  tags            = local.tags
}

module "rds" {
  source = "./modules/rds"

  identifier     = "${var.cluster_name}-db"
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnets
  db_password    = var.db_password
  environment    = var.environment
  tags           = local.tags
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.cluster_name}-redis-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.cluster_name}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  tags                 = local.tags
}

resource "aws_ecr_repository" "frontend" {
  name                 = "opsnova-frontend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = local.tags
}

resource "aws_ecr_repository" "backend" {
  name                 = "opsnova-backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = local.tags
}

resource "aws_cognito_user_pool" "main" {
  name = "${var.cluster_name}-users"

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_numbers   = true
  }

  auto_verified_attributes = ["email"]
  tags                     = local.tags
}

resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.cluster_name}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}

locals {
  tags = {
    Project     = "opsnova"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
