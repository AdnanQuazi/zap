terraform {
  backend "s3" {
    bucket         = "terraform-state-9873" # Your bucket name
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
  }
}