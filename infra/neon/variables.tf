variable "neon_org_id" {
  description = "Neon organization id (Account Settings, or GET /api/v2/organizations)."
  type        = string

  validation {
    condition     = length(trimspace(var.neon_org_id)) > 0
    error_message = "neon_org_id must be set; leaving it empty can create the project in the wrong organization."
  }
}

variable "project_name" {
  description = "Neon project name."
  type        = string
  default     = "common_record"
}

variable "region_id" {
  description = "Neon region id, close to most users. See the Neon regions list."
  type        = string
  default     = "aws-us-east-2"
}

variable "pg_version" {
  description = "PostgreSQL major version."
  type        = number
  default     = 18

  validation {
    condition     = var.pg_version >= 15
    error_message = "db/schema.sql is validated against PostgreSQL 15 or newer."
  }
}

variable "branch_name" {
  description = "Primary branch name."
  type        = string
  default     = "production"
}

variable "database_name" {
  description = "Database name inside the project."
  type        = string
  default     = "neondb"
}

variable "role_name" {
  description = "Application role that owns the database."
  type        = string
  default     = "neondb_owner"
}

variable "history_retention_seconds" {
  description = "Point-in-time-recovery window. Free plans cap at 21600 (6 hours)."
  type        = number
  default     = 21600
}

variable "autoscaling_limit_min_cu" {
  description = "Minimum compute units."
  type        = number
  default     = 0.25
}

variable "autoscaling_limit_max_cu" {
  description = "Maximum compute units."
  type        = number
  default     = 2
}

variable "suspend_timeout_seconds" {
  description = "Idle seconds before the compute suspends. 0 never suspends."
  type        = number
  default     = 0
}
