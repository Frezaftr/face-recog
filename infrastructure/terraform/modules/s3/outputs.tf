output "bucket_name" { value = aws_s3_bucket.images.bucket }
output "bucket_arn"  { value = aws_s3_bucket.images.arn }
output "kms_key_arn" { value = aws_kms_key.s3.arn }
