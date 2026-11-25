/** Raw Vercel payloads. These never leave `adapters/integrations/vercel`. */
export interface VercelUserResponse {
  user: { id: string; username: string };
}

export interface VercelTeam {
  id: string;
  slug: string;
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  /** READY, ERROR, BUILDING, QUEUED, CANCELED, ... */
  state?: string;
  readyState?: string;
  /** "production" for production deployments, null for previews. */
  target?: string | null;
  /** Milliseconds since the epoch. */
  created: number;
  inspectorUrl?: string;
  creator?: { username?: string };
  meta?: {
    githubCommitMessage?: string;
    githubCommitRef?: string;
    githubCommitSha?: string;
  };
}
