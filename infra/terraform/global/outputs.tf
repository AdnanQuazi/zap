output "oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider"
  value       = aws_iam_openid_connect_provider.github.arn
}

output "acm_certificate_arn" {
  description = "ARN of the new wildcard SSL certificate"
  value       = aws_acm_certificate.this.arn
}

output "certificate_validation_records" {
  description = "A map of CNAME records to add to Cloudflare. Key = The domain, Value = The CNAME record."
  value = {
    # This loops over the set and keys by the domain name (which is unique)
    # and provides an object with the name and value to create in Cloudflare
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      value = dvo.resource_record_value
    }
  }
}

output "doppler_sync_role_arn" {
  description = "The ARN of the IAM role for Doppler to assume for syncing secrets."
  value       = aws_iam_role.doppler_sync_role.arn
}
