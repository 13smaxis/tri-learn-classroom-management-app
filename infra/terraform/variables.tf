variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "eu-west-1"
}

variable "environment" {
  type        = string
  description = "Environment (development, staging, production)"
  default     = "development"
}

variable "app_name" {
  type        = string
  description = "Application name"
  default     = "school-app"
}

variable "lambda_memory" {
  type        = number
  description = "Lambda function memory in MB"
  default     = 512
}

variable "lambda_timeout" {
  type        = number
  description = "Lambda function timeout in seconds"
  default     = 30
}

variable "dynamodb_billing_mode" {
  type        = string
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  default     = "PAY_PER_REQUEST"
}
