variable "project_name" {
  type    = string
  default = "personal-dashboard"
}

variable "github_repo" {
  type        = string
  description = "owner/name of the GitHub repository"
}

variable "domain" {
  type    = string
  default = ""
}

variable "environment_variables" {
  type        = map(string)
  sensitive   = true
  description = "Keys from .env.example (DATABASE_URL, SENTRY_DSN, ...)"
  default     = {}
}
