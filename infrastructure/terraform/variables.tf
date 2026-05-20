variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod"
  }
}

variable "project_name" {
  description = "Project name used as a resource prefix"
  type        = string
  default     = "facesearch"
}

# ── VPC ──────────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# ── EKS ──────────────────────────────────────────────────────────────────────

variable "eks_cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.29"
}

variable "eks_node_instance_types" {
  description = "EC2 instance types for the default node group"
  type        = list(string)
  default     = ["m6i.xlarge"]
}

variable "eks_node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 3
}

variable "eks_node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 2
}

variable "eks_node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 10
}

variable "eks_gpu_instance_types" {
  description = "EC2 GPU instance types for face-service node group"
  type        = list(string)
  default     = ["g4dn.xlarge"]
}

variable "eks_gpu_desired_size" {
  description = "Desired number of GPU worker nodes"
  type        = number
  default     = 1
}

# ── RDS ──────────────────────────────────────────────────────────────────────

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "rds_allocated_storage" {
  description = "Initial allocated storage in GiB"
  type        = number
  default     = 100
}

variable "rds_max_allocated_storage" {
  description = "Maximum storage autoscaling ceiling in GiB"
  type        = number
  default     = 500
}

variable "rds_postgres_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16.1"
}

variable "rds_db_name" {
  description = "Initial database name"
  type        = string
  default     = "facesearch"
}

variable "rds_username" {
  description = "Master username for RDS"
  type        = string
  default     = "facesearch_admin"
  sensitive   = true
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = true
}

variable "rds_backup_retention_days" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

# ── MSK (Kafka) ───────────────────────────────────────────────────────────────

variable "msk_kafka_version" {
  description = "Kafka version for MSK"
  type        = string
  default     = "3.5.1"
}

variable "msk_instance_type" {
  description = "MSK broker instance type"
  type        = string
  default     = "kafka.m5.large"
}

variable "msk_number_of_broker_nodes" {
  description = "Number of MSK broker nodes (must be multiple of AZ count)"
  type        = number
  default     = 3
}

variable "msk_ebs_volume_size" {
  description = "EBS volume size per broker node in GiB"
  type        = number
  default     = 100
}

# ── S3 ───────────────────────────────────────────────────────────────────────

variable "s3_force_destroy" {
  description = "Allow Terraform to destroy non-empty S3 buckets (set false in prod)"
  type        = bool
  default     = false
}
