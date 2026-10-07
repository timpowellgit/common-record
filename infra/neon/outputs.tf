output "project_id" {
  description = "Neon project id."
  value       = neon_project.common_record.id
}

output "default_branch_id" {
  description = "Primary branch id."
  value       = neon_project.common_record.default_branch_id
}

output "database_user" {
  description = "Application role name."
  value       = neon_project.common_record.database_user
}

# Deliberately do not export connection URIs. They contain credentials and
# remain accessible inside Terraform state even when marked sensitive.
