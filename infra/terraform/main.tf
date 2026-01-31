# Terraform Configuration for School App

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 backend
  # backend "s3" {
  #   bucket         = "school-app-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "eu-west-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.app_name
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# S3 Bucket for Frontend
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.app_name}-frontend-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# DynamoDB Tables
resource "aws_dynamodb_table" "users" {
  name             = "${var.app_name}-users"
  hash_key         = "userId"
  range_key        = "email"
  billing_mode     = var.dynamodb_billing_mode
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.app_name}-users"
  }
}

resource "aws_dynamodb_table" "classes" {
  name             = "${var.app_name}-classes"
  hash_key         = "classId"
  range_key        = "teacherId"
  billing_mode     = var.dynamodb_billing_mode
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "classId"
    type = "S"
  }

  attribute {
    name = "teacherId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.app_name}-classes"
  }
}

resource "aws_dynamodb_table" "marks" {
  name             = "${var.app_name}-marks"
  hash_key         = "classId"
  range_key        = "learnerId"
  billing_mode     = var.dynamodb_billing_mode
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "classId"
    type = "S"
  }

  attribute {
    name = "learnerId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.app_name}-marks"
  }
}

resource "aws_dynamodb_table" "messages" {
  name             = "${var.app_name}-messages"
  hash_key         = "classId"
  range_key        = "messageId"
  billing_mode     = var.dynamodb_billing_mode
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "classId"
    type = "S"
  }

  attribute {
    name = "messageId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.app_name}-messages"
  }
}

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name                = "${var.app_name}-pool"
  username_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false
  }

  schema {
    name                     = "given_name"
    attribute_data_type      = "String"
    mutable                  = true
    developer_only_attribute = false
  }

  schema {
    name                     = "family_name"
    attribute_data_type      = "String"
    mutable                  = true
    developer_only_attribute = false
  }

  schema {
    name                     = "role"
    attribute_data_type      = "String"
    mutable                  = false
    developer_only_attribute = false
  }

  tags = {
    Name = "${var.app_name}-cognito"
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name                = "${var.app_name}-web-client"
  user_pool_id        = aws_cognito_user_pool.main.id
  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]

  allowed_oauth_flows  = ["code", "implicit"]
  allowed_oauth_scopes = ["email", "openid", "profile"]

  callback_urls = [
    "http://localhost:5173",
    "http://localhost:5173/callback",
    "https://schoolapp.com",
    "https://schoolapp.com/callback"
  ]

  logout_urls = [
    "http://localhost:5173",
    "https://schoolapp.com"
  ]

  prevent_user_existence_errors = "ENABLED"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/lambda/${var.app_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.app_name}-logs"
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.app_name}-lambda-dynamodb"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.classes.arn,
          aws_dynamodb_table.marks.arn,
          aws_dynamodb_table.messages.arn,
          "${aws_dynamodb_table.users.arn}/*",
          "${aws_dynamodb_table.classes.arn}/*",
          "${aws_dynamodb_table.marks.arn}/*",
          "${aws_dynamodb_table.messages.arn}/*"
        ]
      }
    ]
  })
}
