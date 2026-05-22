variable "project_name" { type = string }
variable "environment"  { type = string }
variable "services"     { type = list(string); description = "List of service names to create ECR repos for" }
