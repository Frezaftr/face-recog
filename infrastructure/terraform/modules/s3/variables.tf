variable "project_name"  { type = string }
variable "environment"   { type = string }
variable "force_destroy" { type = bool; default = false }
variable "eks_node_role" { type = string; description = "IAM role ARN of EKS nodes" }
