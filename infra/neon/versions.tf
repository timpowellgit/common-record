terraform {
  required_version = ">= 1.14.0"

  backend "pg" {
    # Connection comes from PG_CONN_STR. Use the DIRECT Neon URI, not the
    # pooler: the backend locks state with session-level advisory locks, and
    # PgBouncer transaction pooling does not preserve a session.
    schema_name = "terraform_remote_state"
  }

  required_providers {
    neon = {
      source = "kislerdm/neon"
      # Community-maintained provider, not officially supported by Neon.
      # Pinned to the version the existing project was imported with.
      version = "0.18.0"
    }
  }
}

provider "neon" {
  # Reads NEON_API_KEY from the environment. Never set it here.
}
