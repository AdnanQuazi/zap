provider "aws" {
  region = "us-east-1"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.19.0"
    }
  }
}

# 1. Create the OIDC provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = ["6938fd4d9c6d157cf1956fff36520b2207092c7b"]
}


# --- DOMAIN AND SSL CERTIFICATE ---
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# 2. Create the wildcard SSL certificate
resource "aws_acm_certificate" "this" {
  provider = aws.us_east_1

  domain_name       = "api.zap.${var.domain_name}"
  subject_alternative_names = [
    "api.zap-staging.${var.domain_name}"     # This covers *.zap-staging.prizmalabs.live
  ]
  validation_method = "DNS" # <-- This is correct

  lifecycle {
    create_before_destroy = true
  }
}

# 3. Wait for the certificate to be validated by AWS
# We will create the validation records manually in Cloudflare
resource "aws_acm_certificate_validation" "this" {
  provider = aws.us_east_1

  certificate_arn = aws_acm_certificate.this.arn
  # We tell Terraform to wait for the records we will create manually
  validation_record_fqdns = [
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.resource_record_name
  ]
}