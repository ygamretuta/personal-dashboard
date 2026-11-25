import type { FeedItem } from "@/features/feed/types";
import { GithubApiError, type GithubClient } from "./client";
import { normalizeGithubCommit } from "./normalize-commit";
import type { GithubCommit, GithubRepo, GithubUser } from "./types";

/** Only the most recently pushed repos are checked, which bounds the API calls per sync. */
const MAX_REPOS = 15;
const COMMITS_PER_REPO = 10;
/** 409 is how GitHub answers for an empty repository; the rest are repos we cannot read. */
const SKIPPABLE_STATUSES = [403, 404, 409, 451];

async function commitsFor(client: GithubClient, repo: string, since: Date) {
  try {
    return await client.get<GithubCommit[]>(`/repos/${repo}/commits`, {
      since: since.toISOString(),
      per_page: COMMITS_PER_REPO,
    });
  } catch (error) {
    if (error instanceof GithubApiError && SKIPPABLE_STATUSES.includes(error.status)) return [];
    throw error;
  }
}

/** Commits pushed to repositories you own since `since`, by you or anyone else. */
export async function fetchCommitItems(client: GithubClient, since: Date): Promise<FeedItem[]> {
  const [viewer, repos] = await Promise.all([
    client.get<GithubUser>("/user"),
    client.get<GithubRepo[]>("/user/repos", {
      affiliation: "owner",
      sort: "pushed",
      per_page: MAX_REPOS,
    }),
  ]);

  const active = repos.filter(
    (repo) => !repo.archived && repo.pushed_at && new Date(repo.pushed_at) >= since,
  );
  const perRepo = await Promise.all(
    active.map(async (repo) =>
      (await commitsFor(client, repo.full_name, since)).map((commit) =>
        normalizeGithubCommit(commit, repo.full_name, viewer.login),
      ),
    ),
  );
  return perRepo.flat();
}
