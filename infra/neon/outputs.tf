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
  description = "Direct connection URI for the primary branch. Contains credentials."
  value       = neon_project.common_record.connection_uri
  sensitive   = true
}

output "connection_uri_pooler" {
  description = "Pooled connection URI, for Hyperdrive. Contains credentials."
  value       = neon_project.common_record.connection_uri_pooler
  sensitive   = true
}
