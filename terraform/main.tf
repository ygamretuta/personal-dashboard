terraform {
  required_providers {
    vercel = { source = "vercel/vercel" }
  }
}

provider "vercel" {}

resource "vercel_project" "app" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }
}

resource "vercel_project_environment_variable" "env" {
  for_each   = var.environment_variables
  project_id = vercel_project.app.id
  key        = each.key
  value      = each.value
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_domain" "primary" {
  count      = var.domain == "" ? 0 : 1
  project_id = vercel_project.app.id
  domain     = var.domain
}
