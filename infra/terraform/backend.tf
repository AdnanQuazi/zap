terraform {
  backend "s3" {
    bucket         = "terraform-state-9873"
    key            = "zap/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
  }
}