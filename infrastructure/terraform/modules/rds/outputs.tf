output "db_endpoint"       { value = aws_db_instance.main.address; sensitive = true }
output "db_port"           { value = aws_db_instance.main.port }
output "db_name"           { value = aws_db_instance.main.db_name }
output "secret_arn"        { value = aws_secretsmanager_secret.rds_password.arn }
output "security_group_id" { value = aws_security_group.rds.id }
