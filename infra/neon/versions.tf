terraform {
  required_version = ">= 1.14.0"

  required_providers {
    neon = {
      source = "kislerdm/neon"
      # Community-maintained provider, not officially supported by Neon.
      # Leave the version range open so `terraform init` picks up the current
      # release; pin it once the first apply has been verified.
      version = ">= 0.6.1"
    }
  }
}

provider "neon" {
  # Reads NEON_API_KEY from the environment. Never set it here.
}
