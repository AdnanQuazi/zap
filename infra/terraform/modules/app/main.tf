data "aws_caller_identity" "current" {}

# 1. ECR Repository (to store the Lambda Docker image)
resource "aws_ecr_repository" "repo" {
  name = "zap-server-${var.env_name}"
}

# 2. IAM Role for the Lambda Function
resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda-exec-role-${var.env_name}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Give Lambda basic permissions to run and write logs
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- THIS POLICY IS UPDATED FOR SSM ---
# Allows the Lambda function to read secrets from SSM Parameter Store
resource "aws_iam_policy" "lambda_read_ssm" {
  name = "lambda-read-ssm-policy-${var.env_name}"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = [
        "ssm:GetParameter",
        "ssm:GetParametersByPath"
      ],
      Effect = "Allow",
      # Restrict access to the specific path for this environment
      Resource = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/doppler/${var.env_name}/*"
    }]
  })
}

# --- THIS ATTACHMENT IS UPDATED FOR SSM ---
resource "aws_iam_role_policy_attachment" "lambda_read_ssm" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_read_ssm.arn
}

# 3. The Lambda Function
resource "aws_lambda_function" "this" {
  function_name = "zap-server-${var.env_name}"
  role          = aws_iam_role.lambda_exec_role.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.repo.repository_url}:dummy" # Your dummy image
  architectures = ["x86_64"]
  timeout       = 30
  memory_size   = 512
  publish       = true

  # --- THIS BLOCK IS UPDATED FOR SSM ---
  # It now passes the SSM_PATH for your secrets.js file
  environment {
    variables = {
      SSM_PATH    = "/doppler/${var.env_name}/"
      NODE_ENV    = "production" # Tells secrets.js to fetch from AWS
    }
  }

  lifecycle {
    ignore_changes = [
      image_uri,
      # Ignore env var changes so Terraform doesn't remove them
      environment, 
    ]
  }
}

# 4. Create an Alias for the Lambda (e.g., "live")
resource "aws_lambda_alias" "live" {
  name             = "live"
  function_name    = aws_lambda_function.this.function_name
  function_version = aws_lambda_function.this.version
  lifecycle {
    ignore_changes = [
      function_version,
    ]
  }
}

# 5. Provisioned Concurrency
resource "aws_lambda_provisioned_concurrency_config" "this" {
  count = var.provisioned_concurrency > 0 ? 1 : 0

  function_name                     = aws_lambda_function.this.function_name
  provisioned_concurrent_executions = var.provisioned_concurrency
  qualifier                         = aws_lambda_alias.live.name
}

# 6. API Gateway (HTTP API)
resource "aws_apigatewayv2_api" "this" {
  name          = "zap-server-api-${var.env_name}"
  protocol_type = "HTTP"
}

# 7. API Gateway Custom Domain
resource "aws_apigatewayv2_domain_name" "this" {
  domain_name = var.full_domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

# 8. API Gateway Integration (Connects API to Lambda)
resource "aws_apigatewayv2_integration" "this" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.live.invoke_arn
  payload_format_version = "2.0"
}

# 9. API Gateway Route (Catch-all route)
resource "aws_apigatewayv2_route" "this" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.this.id}"
}

# 10. API Gateway Stage (Default stage, e.g., /)
resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true
}

# 11. API Gateway Mapping (Connects the domain to the API)
resource "aws_apigatewayv2_api_mapping" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  domain_name = aws_apigatewayv2_domain_name.this.id
  stage       = aws_apigatewayv2_stage.this.id
}

# 12. Lambda Permission (Allows API Gateway to invoke Lambda)
resource "aws_lambda_permission" "this" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"
  qualifier     = aws_lambda_alias.live.name

  source_arn = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# 13. IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions_role" {
  name = "github-actions-role-${var.env_name}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:environment:${var.env_name}"
        }
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

# 14. IAM Policy for GitHub Actions
resource "aws_iam_policy" "github_actions_policy" {
  name = "github-actions-policy-${var.env_name}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ],
        Resource = aws_ecr_repository.repo.arn
      },
      {
        Effect = "Allow",
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:PublishVersion",
          "lambda:UpdateAlias"
        ],
        Resource = [
          aws_lambda_function.this.arn,
          "${aws_lambda_function.this.arn}:*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_policy" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.github_actions_policy.arn
}

