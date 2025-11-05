output "ECR_REPOSITORY" {
  value = module.app_production.ecr_repository_name
}
output "LAMBDA_FUNCTION_NAME" {
  value = module.app_production.lambda_function_name
}
output "LAMBDA_ALIAS_NAME" {
  value = module.app_production.lambda_alias_name
}
output "AWS_ROLE_ARN" {
  value = module.app_production.github_actions_role_arn
}
output "API_GATEWAY_TARGET_DOMAIN" {
  value = module.app_production.api_gateway_target_domain
}