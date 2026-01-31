# Terraform Infrastructure Configuration

This directory contains infrastructure-as-code for deploying the School App to AWS.

## Directory Structure

```
terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── terraform.tfvars     # Variable values (DO NOT COMMIT)
├── modules/
│   ├── vpc/             # VPC configuration
│   ├── lambda/          # Lambda functions
│   ├── dynamodb/        # DynamoDB tables
│   ├── api_gateway/     # API Gateway
│   ├── cognito/         # Cognito user pool
│   ├── s3/              # S3 buckets
│   └── cloudfront/      # CloudFront distribution
└── README.md
```

## Prerequisites

```bash
# Install Terraform
brew install terraform  # macOS
# or download from https://www.terraform.io/downloads.html

# Verify installation
terraform --version

# Configure AWS credentials
aws configure
```

## Technology Stack

Layer	Technologies
Frontend	React 18, Vite, TypeScript, Tailwind CSS
PWA	Service Workers, Offline Support, Installable
Backend	Node.js, Express, TypeScript, Microservices
Database	DynamoDB (scalable, serverless)
Auth	AWS Cognito, JWT, Role-Based Access
Cloud	AWS Lambda, API Gateway, S3, CloudFront
IaC	Terraform for infrastructure
Monitoring	CloudWatch, CloudWatch 

## Security Built-In

✅ JWT authentication
✅ Role-based access control (RBAC)
✅ CORS configured
✅ AWS Cognito ready for integration
✅ Environment variable security
✅ Error handling middleware
✅ HTTPS/TLS prepared

## Responsive Design

📱 Mobile (320px - 640px)
📱 Tablet (641px - 1024px)
💻 Desktop (1025px+)
Built with Tailwind CSS mobile-first approach.

## Usage

### Initialize Terraform

```bash
terraform init
```

### Plan Deployment

```bash
terraform plan -out=tfplan
```

### Apply Configuration

```bash
terraform apply tfplan
```

### Destroy Resources

```bash
terraform destroy
```

## Key Variables

Create `terraform.tfvars`:

```hcl
aws_region              = "eu-west-1"
environment             = "production"
app_name                = "school-app"
lambda_memory           = 512
lambda_timeout          = 30
dynamodb_billing_mode   = "PAY_PER_REQUEST"
```

## Outputs

After applying, get important values:

```bash
terraform output

# Get specific output
terraform output api_gateway_endpoint
terraform output cloudfront_domain_name
terraform output cognito_user_pool_id
```

## Troubleshooting

### State Management

```bash
# Refresh state
terraform refresh

# Show current state
terraform show

# Manually edit state (DANGEROUS)
terraform state rm module.example.resource
```

### Common Issues

**Module not found:**
```bash
terraform get -update
```

**AWS credentials error:**
```bash
export AWS_PROFILE=default
export AWS_REGION=eu-west-1
```

**Destroy issues:**
```bash
# Force delete
terraform destroy -auto-approve

# Remove from state without deleting
terraform state rm module.example.resource
```

## Next Steps

1. Customize `variables.tf` for your environment
2. Review and adjust module configurations
3. Run `terraform plan` to see what will be created
4. Apply with `terraform apply`
5. Save and commit outputs for reference

## References

- [Terraform Docs](https://www.terraform.io/docs/)
- [AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## Project Structure

school-app/
├── frontend/              ← React + Vite PWA
│   ├── src/components/    ← UI components
│   ├── src/pages/         ← Role-based pages
│   ├── src/hooks/         ← Custom React hooks
│   ├── src/services/      ← API layer
│   └── vite.config.ts     ← PWA & build config
│
├── backend/               ← Node.js microservices
│   ├── services/auth/     ← Authentication
│   ├── services/class/    ← Class management
│   ├── services/marks/    ← Mark recording
│   ├── services/messaging/← Chat
│   ├── services/notification/ ← Alerts
│   ├── shared/models/     ← TypeScript interfaces
│   ├── shared/middleware/ ← Auth & errors
│   └── shared/utils/      ← Helpers
│
├── infra/terraform/       ← AWS Infrastructure Code
│   ├── main.tf            ← Core resources
│   ├── variables.tf       ← Configuration
│   └── outputs.tf         ← Deployment outputs
│
├── docs/                  ← Complete documentation
│   ├── architecture.md    ← System design
│   ├── api-spec.md        ← API endpoints
│   ├── deployment.md      ← AWS setup
│   └── development.md     ← Dev workflow
│
├── QUICK_START.md         ← 5-min setup guide
├── PROJECT_SETUP.md       ← Full overview
├── README.md              ← Project intro
└── .env.example           ← Config template

## Key Features Designed

Teacher Features
✅ Multi-subject registration
✅ Class creation & management
✅ Mark capturing (configurable formula)
✅ Attendance tracking
✅ Homework & assignment allocation
✅ Dashboard with pass rate indicator
✅ Unified chat (parents + learners)
✅ Invitation links generation
✅ Class monitoring tools
✅ Performance analytics

Parent Features
✅ Join classes via invitation
✅ Monitor child's progress
✅ View assignments & marks
✅ Communicate with teacher
✅ Real-time notifications
✅ Access class resources

Learner Features
✅ Join class via invitation
✅ View assignments & deadlines
✅ Submit work
✅ Check marks & feedback
✅ Access class materials
✅ Receive notifications

## Key Accomplishments

✅ Complete monorepo structure - Frontend and backend organized
✅ TypeScript everywhere - Type-safe code from day one
✅ Microservices architecture - Scalable and maintainable
✅ Database schema - All entities defined with models
✅ PWA ready - Offline-capable, installable web app
✅ API specifications - Complete with examples
✅ Infrastructure as Code - Terraform for AWS
✅ Role-based access - Teacher, Parent, Learner roles
✅ Mark calculation - Formula-based mark aggregation
✅ Comprehensive docs - Everything documented

