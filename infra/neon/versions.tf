terraform {
  required_version = ">= 1.14.0"

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
