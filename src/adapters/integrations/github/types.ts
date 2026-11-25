/** Raw GitHub payloads. These never leave `adapters/integrations/github`. */
export interface GithubUser {
  login: string;
  avatar_url?: string;
}

export interface GithubNotification {
  id: string;
  reason: string;
  unread: boolean;
  updated_at: string;
  subject: { title: string; url: string; latest_comment_url: string | null; type: string };
  repository: { full_name: string };
}

/** A pull request or an issue; only pull requests carry the diff stats. */
export interface GithubSubject {
  html_url: string;
  body: string | null;
  user: GithubUser;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface GithubComment {
  html_url: string;
  body: string;
  user: GithubUser;
}

export interface GithubRepo {
  full_name: string;
  pushed_at: string | null;
  archived: boolean;
}

export interface GithubCommit {
  sha: string;
  html_url: string;
  commit: { message: string; committer: { name: string; date: string } | null };
  /** Null when the commit email is not linked to a GitHub account. */
  author: GithubUser | null;
}
