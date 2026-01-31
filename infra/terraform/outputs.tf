output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "S3 bucket for frontend hosting"
}

output "dynamodb_users_table" {
  value       = aws_dynamodb_table.users.name
  description = "DynamoDB users table name"
}

output "dynamodb_classes_table" {
  value       = aws_dynamodb_table.classes.name
  description = "DynamoDB classes table name"
}

output "dynamodb_marks_table" {
  value       = aws_dynamodb_table.marks.name
  description = "DynamoDB marks table name"
}

output "dynamodb_messages_table" {
  value       = aws_dynamodb_table.messages.name
  description = "DynamoDB messages table name"
}

output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.main.id
  description = "Cognito user pool ID"
}

output "cognito_user_pool_client_id" {
  value       = aws_cognito_user_pool_client.web.id
  description = "Cognito user pool client ID"
}

output "lambda_role_arn" {
  value       = aws_iam_role.lambda_role.arn
  description = "Lambda execution role ARN"
}

output "cloudwatch_log_group" {
  value       = aws_cloudwatch_log_group.backend.name
  description = "CloudWatch log group for backend"
}
