variable "project_name"              { type = string }
variable "environment"               { type = string }
variable "vpc_id"                    { type = string }
variable "private_subnet_ids"        { type = list(string) }
variable "allowed_security_group_id" { type = string }
variable "instance_class"            { type = string }
variable "allocated_storage"         { type = number }
variable "max_allocated_storage"     { type = number }
variable "postgres_version"          { type = string }
variable "db_name"                   { type = string }
variable "username"                  { type = string; sensitive = true }
variable "multi_az"                  { type = bool }
variable "backup_retention_days"     { type = number }
