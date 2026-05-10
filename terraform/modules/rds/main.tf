resource "aws_db_subnet_group" "main" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids
  tags       = var.tags
}

resource "aws_security_group" "rds" {
  name   = "${var.identifier}-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }
  tags = var.tags
}

resource "aws_db_instance" "main" {
  identifier        = var.identifier
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.medium"
  allocated_storage = 100
  storage_encrypted = true
  multi_az          = var.environment == "production"

  db_name  = "opsnova"
  username = "opsnova"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  skip_final_snapshot     = var.environment != "production"
  deletion_protection     = var.environment == "production"

  tags = var.tags
}

variable "identifier" {}
variable "vpc_id" {}
variable "subnet_ids" { type = list(string) }
variable "db_password" { sensitive = true }
variable "environment" {}
variable "tags" { type = map(string) }

output "endpoint" { value = aws_db_instance.main.endpoint }
