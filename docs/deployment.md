# Deployment Guide

## Prerequisites

- AWS Account with appropriate permissions
- Node.js 18+
- npm/yarn
- AWS CLI configured
- Terraform or AWS CloudFormation knowledge

## Architecture Deployment

### Phase 1: Prerequisites Setup

#### 1.1 AWS Account Setup
```bash
# Configure AWS CLI
aws configure

# Verify credentials
aws sts get-caller-identity
```

#### 1.2 Create S3 Bucket for Terraform State
```bash
aws s3 mb s3://school-app-terraform-state-$(date +%s)
aws s3api put-bucket-versioning --bucket school-app-terraform-state-xxx --versioning-configuration Status=Enabled
```

### Phase 2: Infrastructure Deployment

#### 2.1 Deploy with Terraform (Recommended)

```bash
cd infra/terraform

# Initialize Terraform
terraform init \
  -backend-config="bucket=school-app-terraform-state-xxx" \
  -backend-config="key=prod/terraform.tfstate" \
  -backend-config="region=eu-west-1"

# Plan deployment
terraform plan -out=tfplan

# Apply configuration
terraform apply tfplan

# Output important values
terraform output
```

#### 2.2 AWS Services to Deploy

**Frontend Infrastructure:**
- S3 Bucket (with versioning, public access enabled)
- CloudFront Distribution
- Route 53 DNS records
- ACM SSL Certificate

**Backend Infrastructure:**
- API Gateway
- Lambda Functions (per service)
- DynamoDB Tables
- RDS PostgreSQL (optional)
- IAM Roles and Policies
- Security Groups and VPC

**Monitoring & Logging:**
- CloudWatch Log Groups
- CloudWatch Alarms
- X-Ray Tracing

### Phase 3: Database Setup

#### 3.1 DynamoDB Tables

```bash
# Create Tables via AWS CLI or Terraform

# Users Table
aws dynamodb create-table \
  --table-name users \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=email,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Classes Table
aws dynamodb create-table \
  --table-name classes \
  --attribute-definitions AttributeName=classId,AttributeType=S AttributeName=teacherId,AttributeType=S \
  --key-schema AttributeName=classId,KeyType=HASH AttributeName=teacherId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Marks Table
aws dynamodb create-table \
  --table-name marks \
  --attribute-definitions AttributeName=classId,AttributeType=S AttributeName=learnerId,AttributeType=S \
  --key-schema AttributeName=classId,KeyType=HASH AttributeName=learnerId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Messages Table
aws dynamodb create-table \
  --table-name messages \
  --attribute-definitions AttributeName=classId,AttributeType=S AttributeName=messageId,AttributeType=S \
  --key-schema AttributeName=classId,KeyType=HASH AttributeName=messageId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

#### 3.2 Seed Initial Data (Optional)
```bash
# Create seed script for initial data
node scripts/seed-database.js
```

### Phase 4: Authentication Setup

#### 4.1 AWS Cognito Configuration

```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name SchoolAppPool \
  --policies PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}

# Create User Pool Client
aws cognito-idp create-user-pool-client \
  --user-pool-id eu-west-1_xxxxx \
  --client-name school-app-web \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --callback-urls http://localhost:5173 https://schoolapp.com \
  --logout-urls http://localhost:5173 https://schoolapp.com
```

#### 4.2 Update Environment Variables

```bash
# .env.production
VITE_COGNITO_USER_POOL_ID=eu-west-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_COGNITO_DOMAIN=https://schoolapp.auth.eu-west-1.amazoncognito.com
```

### Phase 5: Frontend Deployment

#### 5.1 Build Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output will be in dist/
```

#### 5.2 Deploy to S3

```bash
# Upload to S3
aws s3 sync dist/ s3://school-app-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123456 \
  --paths "/*"
```

#### 5.3 Verify Deployment

```bash
# Check S3 bucket
aws s3 ls s3://school-app-bucket/

# Check CloudFront status
aws cloudfront get-distribution --id E123456
```

### Phase 6: Backend Deployment

#### 6.1 Build Backend Services

```bash
cd backend

# Install dependencies
npm install

# Build services
npm run build
```

#### 6.2 Deploy Lambda Functions

```bash
# Using SAM CLI
sam build
sam deploy --guided

# Or using Terraform
cd infra/terraform
terraform apply
```

#### 6.3 Configure Lambda Environment Variables

```bash
# Set environment variables for Lambda functions
aws lambda update-function-configuration \
  --function-name auth-service \
  --environment Variables={NODE_ENV=production,AWS_REGION=eu-west-1}
```

### Phase 7: API Gateway Setup

#### 7.1 Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api \
  --name SchoolAppAPI \
  --description "School Management App API"

# Configure resources and methods to point to Lambda functions
# (Typically done via Terraform or CloudFormation)
```

#### 7.2 Configure CORS

```bash
# Enable CORS on API Gateway
aws apigateway put-integration-response \
  --rest-api-id xxxxx \
  --resource-id xxxxx \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key"}'
```

#### 7.3 Deploy API

```bash
aws apigateway create-deployment \
  --rest-api-id xxxxx \
  --stage-name prod
```

### Phase 8: Domain & SSL Configuration

#### 8.1 Configure Route 53

```bash
# Create hosted zone (if not existing)
aws route53 create-hosted-zone \
  --name schoolapp.com \
  --caller-reference $(date +%s)

# Create CloudFront alias record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-changes.json
```

#### 8.2 SSL Certificate (ACM)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name schoolapp.com \
  --validation-method DNS

# Validate certificate (add DNS records)
# Update CloudFront and API Gateway to use certificate
```

### Phase 9: Monitoring & Logging

#### 9.1 CloudWatch Setup

```bash
# Create log groups
aws logs create-log-group --log-group-name /school-app/frontend
aws logs create-log-group --log-group-name /school-app/backend
aws logs create-log-group --log-group-name /school-app/auth-service
```

#### 9.2 Create Alarms

```bash
# Lambda error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name auth-service-errors \
  --alarm-description "Alert on auth service errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### Phase 10: CI/CD Pipeline

#### 10.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci && npm run build
      - run: aws s3 sync frontend/dist s3://school-app-bucket --delete
      - run: aws cloudfront create-invalidation --distribution-id E123456 --paths "/*"

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci && npm run build
      - run: sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Frontend
curl https://schoolapp.com/health

# Backend
curl https://api.schoolapp.com/health
```

### 2. Smoke Tests

```bash
# Run integration tests
npm run test:integration
```

### 3. Monitoring

```bash
# Check CloudWatch logs
aws logs tail /school-app/backend --follow

# Check Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average,Maximum
```

## Rollback Procedure

### Frontend Rollback

```bash
# Sync previous version from backup
aws s3 sync s3://school-app-backup/v1.0.0 s3://school-app-bucket --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E123456 --paths "/*"
```

### Backend Rollback

```bash
# Update Lambda aliases to previous version
aws lambda update-alias \
  --function-name auth-service \
  --name live \
  --function-version 5
```

## Cost Optimization

1. **DynamoDB**: Use on-demand billing for variable workloads
2. **Lambda**: Set appropriate memory allocation (128MB-3008MB)
3. **S3**: Enable lifecycle policies for old objects
4. **CloudFront**: Configure appropriate cache TTLs
5. **RDS**: Use Reserved Instances for predictable workloads

## Security Best Practices

1. ✅ Enable VPC for Lambda functions
2. ✅ Use Secrets Manager for sensitive data
3. ✅ Enable WAF on CloudFront
4. ✅ Enable encryption at rest and in transit
5. ✅ Implement MFA for AWS Console access
6. ✅ Regular security audits and penetration testing
7. ✅ Enable CloudTrail for audit logging

## Troubleshooting

### Lambda Cold Start Issues
- Increase memory allocation
- Use Lambda Provisioned Concurrency
- Optimize dependencies

### API Gateway Throttling
- Increase throttle limits
- Implement caching
- Use API Gateway caching

### DynamoDB Hot Partitions
- Review partition key design
- Use Global Secondary Indexes
- Consider read/write capacity scaling

## Support & Documentation

- AWS Documentation: https://docs.aws.amazon.com/
- Project Wiki: (Link to internal wiki)
- Team Slack: #school-app-dev
