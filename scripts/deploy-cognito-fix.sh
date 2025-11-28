#!/bin/bash

# Deploy script for AWS Chime Client with Cognito fixes
# This script will redeploy the CloudFormation stack with updated Cognito settings

set -e

echo "🚀 Deploying AWS Chime Client with Cognito fixes..."

# Check if SAM CLI is available
if ! command -v sam &> /dev/null; then
    echo "❌ SAM CLI not found. Please install it first."
    echo "Run: pip install aws-sam-cli"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get current region
REGION=$(aws configure get region 2>/dev/null || echo "ap-southeast-2")
echo "📍 Using AWS region: $REGION"

# Build and deploy
echo "🔨 Building SAM application..."
sam build

echo "🚀 Deploying to AWS..."
sam deploy --region $REGION

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Next steps to verify the fix:"
    echo "1. Go to AWS Console > Cognito > User Pools"
    echo "2. Find your 'ChimeClientUsers' pool"
    echo "3. Go to App integration > App clients > ChimeClientApp"
    echo "4. Verify these settings:"
    echo "   ✅ Identity providers: Cognito user pool (checked)"
    echo "   ✅ OAuth flows: Implicit grant (checked)"
    echo "   ✅ OAuth scopes: openid, email, profile (all checked)"
    echo "   ✅ Callback URLs include:"
    echo "      - http://localhost:8000/"
    echo "      - https://georges034302.github.io/aws-chime-client/"
    echo "      - https://psychic-couscous-vpjv9v66xgf6wp5-8000.app.github.dev/"
    echo ""
    echo "🌐 Test the login at: https://psychic-couscous-vpjv9v66xgf6wp5-8000.app.github.dev/"
    echo ""
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi