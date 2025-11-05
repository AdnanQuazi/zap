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

data "terraform_remote_state" "global" {
  backend = "s3"
  config = {
    bucket = "terraform-state-9873" 
    key    = "global/terraform.tfstate"
    region = "us-east-1"
  }
}

module "app_staging" {
  source = "../modules/app" 

  env_name          = "staging"
  github_repo       = "AdnanQuazi/zap"
  oidc_provider_arn = data.terraform_remote_state.global.outputs.oidc_provider_arn
  
  acm_certificate_arn   = data.terraform_remote_state.global.outputs.acm_certificate_arn
  full_domain_name      = "api.zap-staging.prizmalabs.live"
  provisioned_concurrency = 0 # This is the key: 0 for staging
}