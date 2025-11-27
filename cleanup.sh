#!/bin/bash

REGION="ap-southeast-2"
HELPER_STACK="aws-sam-cli-managed-default"

# Remove local SAM build folder
rm -rf .aws-sam

# Get SAM artifact bucket
BUCKET=$(aws cloudformation describe-stack-resources \
  --stack-name "$HELPER_STACK" \
  --region "$REGION" \
  --query "StackResources[?ResourceType=='AWS::S3::Bucket'].PhysicalResourceId" \
  --output text 2>/dev/null)

# Empty and delete bucket
if [[ -n "$BUCKET" ]]; then
  # Delete all object versions
  aws s3api list-object-versions \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --query 'Versions[].{Key:Key,VersionId:VersionId}' \
    --output json 2>/dev/null | \
  jq -r '.[] | "aws s3api delete-object --bucket '$BUCKET' --region '$REGION' --key \"" + .Key + "\" --version-id \"" + .VersionId + "\""' | \
  bash 2>/dev/null
  
  # Delete all delete markers
  aws s3api list-object-versions \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' \
    --output json 2>/dev/null | \
  jq -r '.[] | "aws s3api delete-object --bucket '$BUCKET' --region '$REGION' --key \"" + .Key + "\" --version-id \"" + .VersionId + "\""' | \
  bash 2>/dev/null
  
  # Delete bucket
  aws s3 rb "s3://$BUCKET" --force --region "$REGION" 2>/dev/null
fi

# Delete SAM helper stack
aws cloudformation delete-stack \
  --stack-name "$HELPER_STACK" \
  --region "$REGION" 2>/dev/null

aws cloudformation wait stack-delete-complete \
  --stack-name "$HELPER_STACK" \
  --region "$REGION" 2>/dev/null

echo "✅ Cleanup complete"
