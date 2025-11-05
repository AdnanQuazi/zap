output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.repo.name
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.this.function_name
}

output "lambda_alias_name" {
  description = "Name of the 'live' alias for the Lambda"
  value       = aws_lambda_alias.live.name
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = aws_iam_role.github_actions_role.arn
}

output "api_gateway_target_domain" {
  description = "The target domain for your CNAME record in Cloudflare"
  value       = aws_apigatewayv2_domain_name.this.domain_name_configuration[0].target_domain_name
}