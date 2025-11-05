variable "env_name" {
  description = "The name of the environment (e.g., 'staging', 'main')"
  type        = string
}

variable "github_repo" {
  description = "Your GitHub repository in 'org/repo' format"
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the SSL certificate"
  type        = string
}

variable "full_domain_name" {
  description = "The full subdomain, e.g., api-staging.yourdomain.com"
  type        = string
}

variable "provisioned_concurrency" {
  description = "Number of 'warm' instances to keep ready (0 for staging, 1 for prod)"
  type        = number
  default     = 0
}