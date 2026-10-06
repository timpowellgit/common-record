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

output "connection_uri" {
  description = "Connection URI for the primary branch. Contains credentials."
  value       = neon_project.common_record.connection_uri
  sensitive   = true
}
