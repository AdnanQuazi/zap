terraform {
  backend "s3" {
    bucket         = "terraform-state-9873" # Your bucket name
    key            = "production/terraform.tfstate" # <-- This is the only change
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
  }
}