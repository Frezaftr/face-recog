module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

module "eks" {
  source = "./modules/eks"

  project_name            = var.project_name
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  cluster_version         = var.eks_cluster_version
  node_instance_types     = var.eks_node_instance_types
  node_desired_size       = var.eks_node_desired_size
  node_min_size           = var.eks_node_min_size
  node_max_size           = var.eks_node_max_size
  gpu_instance_types      = var.eks_gpu_instance_types
  gpu_desired_size        = var.eks_gpu_desired_size
}

module "rds" {
  source = "./modules/rds"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  allowed_security_group_id = module.eks.node_security_group_id
  instance_class            = var.rds_instance_class
  allocated_storage         = var.rds_allocated_storage
  max_allocated_storage     = var.rds_max_allocated_storage
  postgres_version          = var.rds_postgres_version
  db_name                   = var.rds_db_name
  username                  = var.rds_username
  multi_az                  = var.rds_multi_az
  backup_retention_days     = var.rds_backup_retention_days
}

module "msk" {
  source = "./modules/msk"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  allowed_security_group_id = module.eks.node_security_group_id
  kafka_version             = var.msk_kafka_version
  instance_type             = var.msk_instance_type
  number_of_broker_nodes    = var.msk_number_of_broker_nodes
  ebs_volume_size           = var.msk_ebs_volume_size
}

module "s3" {
  source = "./modules/s3"

  project_name   = var.project_name
  environment    = var.environment
  force_destroy  = var.s3_force_destroy
  eks_node_role  = module.eks.node_iam_role_arn
}

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  services     = ["api-gateway", "face-service", "worker", "web"]
}
