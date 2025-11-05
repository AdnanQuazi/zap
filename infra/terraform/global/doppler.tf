# This gives Doppler permission to sync secrets to AWS SSM Parameter Store

data "aws_caller_identity" "current" {}

# 1. The IAM Role for Doppler (This is the same as before)
resource "aws_iam_role" "doppler_sync_role" {
  name = "doppler-secrets-manager-role" # The name is still fine

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        AWS = "arn:aws:iam::299900769157:user/doppler-integration-operator"
      }
    }]
  })
}

# 2. The Policy (This is UPDATED for SSM)
resource "aws_iam_policy" "doppler_sync_policy" {
  name = "doppler-ssm-parameter-store-policy" # Renamed policy
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = [
        # Allows Doppler to create and update parameters
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "ssm:AddTagsToResource",
        "ssm:RemoveTagsFromResource",
        "ssm:DescribeParameters",
        "ssm:GetParameters"
      ],
      Effect   = "Allow",
      # Restrict this role to only manage parameters with the "doppler/" prefix
      Resource = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/doppler/*"
    }]
  })
}

# 3. Attach the policy to the role (This is the same as before)
resource "aws_iam_role_policy_attachment" "doppler_sync_attach" {
  role       = aws_iam_role.doppler_sync_role.name
  policy_arn = aws_iam_policy.doppler_sync_policy.arn
}