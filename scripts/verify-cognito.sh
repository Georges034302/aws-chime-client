#!/bin/bash

# Cognito Configuration Verification Script
# This script helps verify that your Cognito setup matches the troubleshooting guide

set -e

echo "🔍 Verifying Cognito Configuration..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get current region
REGION=$(aws configure get region 2>/dev/null || echo "ap-southeast-2")
echo "📍 Using AWS region: $REGION"

# Find the Cognito User Pool from CloudFormation stack
echo "🔍 Looking for Cognito User Pool in aws-chime-api stack..."
USER_POOL_ID=$(aws cloudformation describe-stack-resources --stack-name aws-chime-api \
    --query 'StackResources[?ResourceType==`AWS::Cognito::UserPool`].PhysicalResourceId' \
    --output text 2>/dev/null || echo "")

if [ -z "$USER_POOL_ID" ]; then
    echo "❌ No Cognito User Pool found in aws-chime-api stack. Have you deployed the stack?"
    exit 1
fi

echo "✅ Found User Pool: $USER_POOL_ID"

# Get app client details
echo "🔍 Getting app client configuration..."
APP_CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --region $REGION \
    --query "UserPoolClients[?ClientName=='ChimeClientApp'].ClientId" --output text 2>/dev/null || echo "")

if [ -z "$APP_CLIENT_ID" ]; then
    echo "❌ No ChimeClientApp client found."
    exit 1
fi

echo "✅ Found App Client: $APP_CLIENT_ID"

# Get detailed app client configuration
echo "📋 Checking app client configuration..."
aws cognito-idp describe-user-pool-client --user-pool-id $USER_POOL_ID --client-id $APP_CLIENT_ID --region $REGION \
    --query '{
        ClientName: ClientName,
        SupportedIdentityProviders: SupportedIdentityProviders,
        AllowedOAuthFlows: AllowedOAuthFlows,
        AllowedOAuthScopes: AllowedOAuthScopes,
        CallbackURLs: CallbackURLs,
        LogoutURLs: LogoutURLs,
        AllowedOAuthFlowsUserPoolClient: AllowedOAuthFlowsUserPoolClient
    }' --output table

# Check domain configuration
echo ""
echo "🌐 Checking Hosted UI domain..."
DOMAIN_INFO=$(aws cognito-idp describe-user-pool-domain --domain "chime-client-1764319994-19362" --region $REGION 2>/dev/null || echo "")

if [ -n "$DOMAIN_INFO" ]; then
    echo "✅ Hosted UI domain is configured"
    echo "$DOMAIN_INFO" | jq -r '.DomainDescription | "Domain: \(.Domain)\nStatus: \(.Status)"'
else
    echo "❌ Hosted UI domain not found or not configured"
fi

echo ""
echo "📝 Manual verification checklist:"
echo "In the AWS Console, verify these settings for your app client:"
echo ""
echo "✅ Identity Providers:"
echo "   - Cognito user pool (should be checked)"
echo ""
echo "✅ Allowed OAuth flows:"
echo "   - Implicit grant (should be checked)"
echo ""
echo "✅ Allowed OAuth scopes:"
echo "   - openid (should be checked)"
echo "   - email (should be checked)" 
echo "   - profile (should be checked)"
echo ""
echo "✅ Callback URLs should include:"
echo "   - http://localhost:8000/"
echo "   - https://georges034302.github.io/aws-chime-client/"
echo "   - https://psychic-couscous-vpjv9v66xgf6wp5-8000.app.github.dev/"
echo ""
echo "🔗 Expected login URL format:"
echo "https://chime-client-1764319994-19362.auth.$REGION.amazoncognito.com/login?client_id=$APP_CLIENT_ID&response_type=token&scope=openid+email+profile&redirect_uri=https%3A%2F%2Fpsychic-couscous-vpjv9v66xgf6wp5-8000.app.github.dev%2F"