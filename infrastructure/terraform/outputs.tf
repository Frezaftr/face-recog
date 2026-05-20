output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = module.rds.db_port
}

output "msk_bootstrap_brokers" {
  description = "MSK bootstrap broker string (PLAINTEXT)"
  value       = module.msk.bootstrap_brokers
  sensitive   = true
}

output "msk_bootstrap_brokers_tls" {
  description = "MSK bootstrap broker string (TLS)"
  value       = module.msk.bootstrap_brokers_tls
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the images S3 bucket"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the images S3 bucket"
  value       = module.s3.bucket_arn
}

output "ecr_api_gateway_url" {
  description = "ECR repository URL for api-gateway"
  value       = module.ecr.repository_urls["api-gateway"]
}

output "ecr_face_service_url" {
  description = "ECR repository URL for face-service"
  value       = module.ecr.repository_urls["face-service"]
}

output "ecr_worker_url" {
  description = "ECR repository URL for worker"
  value       = module.ecr.repository_urls["worker"]
}

output "ecr_web_url" {
  description = "ECR repository URL for web"
  value       = module.ecr.repository_urls["web"]
}

output "configure_kubectl" {
  description = "Run this command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}
