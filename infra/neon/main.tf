resource "neon_project" "common_record" {
  name       = var.project_name
  pg_version = var.pg_version
  region_id  = var.region_id

  # Always set org_id. Omitting it can create the project in the wrong
  # organization and later plans may try to replace it.
  org_id = var.neon_org_id

  history_retention_seconds = var.history_retention_seconds

  branch {
    name          = var.branch_name
    database_name = var.database_name
    role_name     = var.role_name
  }

  default_endpoint_settings {
    autoscaling_limit_min_cu = var.autoscaling_limit_min_cu
    autoscaling_limit_max_cu = var.autoscaling_limit_max_cu
  }

  lifecycle {
    # The project holds the pilot data. A stray config change must never
    # recreate it. Remove a resource by hand when that is actually intended.
    prevent_destroy = true
  }
}
