# Bootstrap script — run ONCE before `terraform init` to create the S3 backend
# and DynamoDB lock table that Terraform uses to store remote state.
#
# Usage:
#   chmod +x bootstrap.sh
#   AWS_REGION=us-east-1 ./bootstrap.sh

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
BUCKET="facesearch-terraform-state"
TABLE="facesearch-terraform-locks"

echo "==> Creating S3 state bucket: $BUCKET"
if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION"
else
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
fi

aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms"
      }
    }]
  }'

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "==> Creating DynamoDB lock table: $TABLE"
aws dynamodb create-table \
  --table-name "$TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --sse-specification Enabled=true

echo ""
echo "Bootstrap complete. Now run:"
echo "  terraform init"
echo "  cp terraform.tfvars.example terraform.tfvars && vi terraform.tfvars"
echo "  terraform plan"
echo "  terraform apply"
