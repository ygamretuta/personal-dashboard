import { TIME } from "@/lib/constants";
import type { ActionType, FeedItem, Source } from "@/features/feed/types";

const DEMO_URL = "https://example.com/demo";

type SeedItem = Omit<
  FeedItem,
  "id" | "externalId" | "receivedAt" | "status" | "replies" | "preview" | "url"
> & {
  externalId: string;
  minutesAgo: number;
  dueInMinutes?: number;
};

const MESSAGE_ACTIONS: ActionType[] = ["reply", "markRead", "snooze", "open"];
const EMAIL_ACTIONS: ActionType[] = ["reply", "archive", "markRead", "snooze", "open"];
const EVENT_ACTIONS: ActionType[] = ["open", "snooze", "archive"];
const GITHUB_ACTIONS: ActionType[] = ["open", "archive", "snooze", "markRead"];

const PREVIEW_LENGTH = 110;

function toFeedItem(seed: SeedItem, now: Date): FeedItem {
  const { minutesAgo, dueInMinutes, externalId, ...rest } = seed;
  const at = (minutes: number) => new Date(now.getTime() + minutes * TIME.MINUTE_MS).toISOString();
  return {
    ...rest,
    id: `${seed.source}:${externalId}`,
    externalId,
    preview: seed.body.replace(/\s+/g, " ").slice(0, PREVIEW_LENGTH),
    url: `${DEMO_URL}/${seed.source}/${externalId}`,
    receivedAt: at(-minutesAgo),
    dueAt: dueInMinutes === undefined ? undefined : at(dueInMinutes),
    status: "unread",
    replies: [],
  };
}

const SLACK: SeedItem[] = [
  {
    externalId: "dm-1",
    source: "slack",
    kind: "message",
    priority: "high",
    minutesAgo: 6,
    actions: MESSAGE_ACTIONS,
    title: "Priya Nair in a direct message",
    sender: { name: "Priya Nair", handle: "@priya" },
    body: "Morning! Can you look at the staging deploy before standup? The migration job is stuck on step 3 and I don't want to roll back without a second pair of eyes.\n\nLogs are in the #deploys thread.",
  },
  {
    externalId: "mention-1",
    source: "slack",
    kind: "message",
    priority: "normal",
    minutesAgo: 48,
    actions: MESSAGE_ACTIONS,
    title: "Marcus Lee mentioned you in #eng-platform",
    sender: { name: "Marcus Lee", handle: "@marcus" },
    body: "@you the rate limiter PR needs your sign-off before we can cut the release. Main open question: do we back off per account or per workspace?",
  },
  {
    externalId: "thread-1",
    source: "slack",
    kind: "message",
    priority: "low",
    minutesAgo: 190,
    actions: MESSAGE_ACTIONS,
    title: "Aiko Tanaka replied in #design",
    sender: { name: "Aiko Tanaka", handle: "@aiko" },
    body: "Thanks for the quick pass on the empty states. I swapped the illustration for a plain icon like you suggested. Much quieter.",
  },
];

const GMAIL: SeedItem[] = [
  {
    externalId: "thread-loop",
    source: "gmail",
    kind: "email",
    priority: "high",
    minutesAgo: 25,
    actions: EMAIL_ACTIONS,
    title: "Interview loop confirmed for Thursday",
    sender: { name: "Dana Whitfield", handle: "dana@northwind.example" },
    body: "Hi,\n\nThe panel is confirmed for Thursday at 2:00 PM. You'll meet four people over three hours: a system design session, a pairing session and a conversation with the hiring manager.\n\nLet me know if any of those times need to move.\n\nBest,\nDana",
  },
  {
    externalId: "thread-roadmap",
    source: "gmail",
    kind: "email",
    priority: "normal",
    minutesAgo: 95,
    actions: EMAIL_ACTIONS,
    title: "Re: Q4 roadmap draft",
    sender: { name: "Sam Okafor", handle: "sam@acme.example" },
    body: "Left comments on sections 2 and 4. The sequencing for the billing work looks risky: can we split it so the migration ships first?\n\nHappy to jump on a call.",
  },
  {
    externalId: "thread-invoice",
    source: "gmail",
    kind: "email",
    priority: "normal",
    minutesAgo: 320,
    actions: EMAIL_ACTIONS,
    title: "Invoice #2041 is due Friday",
    sender: { name: "Billing", handle: "billing@hosting.example" },
    body: "Your invoice for November is ready. Amount due: $42.00. Payment is due Friday. You can download the PDF from your account page.",
  },
  {
    externalId: "thread-digest",
    source: "gmail",
    kind: "email",
    priority: "low",
    minutesAgo: 600,
    actions: EMAIL_ACTIONS,
    title: "Your weekly product analytics digest",
    sender: { name: "Analytics", handle: "digest@analytics.example" },
    body: "Weekly active users are up 4% week over week. The top landing page was /pricing. See the full report in your dashboard.",
  },
];

const CALENDAR: SeedItem[] = [
  {
    externalId: "standup",
    source: "calendar",
    kind: "event",
    priority: "high",
    minutesAgo: 120,
    dueInMinutes: 25,
    actions: EVENT_ACTIONS,
    title: "Team standup",
    sender: { name: "Engineering", handle: "Google Meet" },
    body: "Team standup\nGoogle Meet · 15 minutes\n\nAgenda: staging deploy, rate limiter PR, release plan.",
  },
  {
    externalId: "one-on-one",
    source: "calendar",
    kind: "event",
    priority: "normal",
    minutesAgo: 120,
    dueInMinutes: 180,
    actions: EVENT_ACTIONS,
    title: "1:1 with Priya",
    sender: { name: "Priya Nair", handle: "Google Meet" },
    body: "1:1 with Priya\nGoogle Meet · 30 minutes\n\nTopics: career goals, on-call rotation.",
  },
  {
    externalId: "design-review",
    source: "calendar",
    kind: "event",
    priority: "low",
    minutesAgo: 120,
    dueInMinutes: 330,
    actions: EVENT_ACTIONS,
    title: "Design review: inbox empty states",
    sender: { name: "Aiko Tanaka", handle: "Room 4B" },
    body: "Design review: inbox empty states\nRoom 4B · 45 minutes\n\nReviewing the empty, error and loading states.",
  },
];

const GITHUB: SeedItem[] = [
  {
    externalId: "pr-142",
    source: "github",
    kind: "review_request",
    priority: "high",
    minutesAgo: 40,
    actions: GITHUB_ACTIONS,
    title: "feat: encrypt OAuth tokens with AES-GCM (#142)",
    sender: { name: "Marcus Lee", handle: "marcus" },
    body: "Marcus Lee requested your review on acme/platform#142.\n\nAdds an encrypted token store so refresh tokens are never persisted in plaintext. +184 −12 across 6 files.",
  },
  {
    externalId: "pr-139",
    source: "github",
    kind: "review_request",
    priority: "normal",
    minutesAgo: 220,
    actions: GITHUB_ACTIONS,
    title: "fix: back off on HTTP 429 in the Slack adapter (#139)",
    sender: { name: "Aiko Tanaka", handle: "aiko" },
    body: "Aiko Tanaka requested your review on acme/platform#139.\n\nHonors the Retry-After header and retries up to three times. +61 −4 across 2 files.",
  },
  {
    externalId: "issue-131",
    source: "github",
    kind: "issue",
    priority: "low",
    minutesAgo: 780,
    actions: GITHUB_ACTIONS,
    title: "Flaky e2e test on Safari (#131)",
    sender: { name: "Sam Okafor", handle: "sam" },
    body: 'Sam Okafor mentioned you in acme/platform#131.\n\n"@you does the focus trap in the dialog behave differently on WebKit? The e2e fails about one run in ten."',
  },
  {
    externalId: "commit:acme/platform:9f3c2ab",
    source: "github",
    kind: "commit",
    priority: "normal",
    minutesAgo: 95,
    actions: GITHUB_ACTIONS,
    title: "Refresh OAuth tokens a minute early (acme/platform@9f3c2ab)",
    sender: { name: "Marcus Lee", handle: "marcus" },
    body: "Marcus Lee pushed 9f3c2ab to acme/platform.\n\nRefresh OAuth tokens a minute early\n\nAvoids a race where a token expires between the check and the request.",
  },
];

/** Items that arrive after load, one per sync, to show the live feed. */
const INCOMING: SeedItem[] = [
  {
    externalId: "dm-2",
    source: "slack",
    kind: "message",
    priority: "high",
    minutesAgo: 0,
    actions: MESSAGE_ACTIONS,
    title: "Priya Nair in a direct message",
    sender: { name: "Priya Nair", handle: "@priya" },
    body: "Never mind, I got the migration unstuck. Staging is green. Thanks anyway!",
  },
  {
    externalId: "thread-offer",
    source: "gmail",
    kind: "email",
    priority: "high",
    minutesAgo: 0,
    actions: EMAIL_ACTIONS,
    title: "Quick question before Thursday",
    sender: { name: "Dana Whitfield", handle: "dana@northwind.example" },
    body: "One more thing: could you share a link to the repo you'd like to walk through during the pairing session? Thanks!",
  },
];

const VERCEL: SeedItem[] = [
  {
    externalId: "deployment:dpl_demo_failed",
    source: "vercel",
    kind: "deployment",
    priority: "high",
    minutesAgo: 25,
    actions: GITHUB_ACTIONS,
    title: "personal-dashboard: production deployment failed",
    sender: { name: "Marcus Lee", handle: "marcus" },
    body: "marcus triggered a failed production deployment of personal-dashboard.\n\nfix: back off on HTTP 429 in the Slack adapter\n\nmain @ 4d2e9c1\n\nBuild failed: type error in src/adapters/integrations/slack/client.ts.",
  },
  {
    externalId: "deployment:dpl_demo_ready",
    source: "vercel",
    kind: "deployment",
    priority: "low",
    minutesAgo: 190,
    actions: GITHUB_ACTIONS,
    title: "personal-dashboard deployed to production",
    sender: { name: "Aiko Tanaka", handle: "aiko" },
    body: "aiko shipped a production deployment of personal-dashboard.\n\nfeat: add calendar page\n\nmain @ 9f3c2ab",
  },
];

const SENTRY: SeedItem[] = [
  {
    externalId: "issue:demo-1",
    source: "sentry",
    kind: "error",
    priority: "high",
    minutesAgo: 12,
    actions: GITHUB_ACTIONS,
    title: "TypeError: Cannot read properties of undefined (reading 'accessToken')",
    sender: { name: "personal-dashboard", handle: "DASHBOARD-1" },
    body: "error in personal-dashboard\n\nCulprit: refreshAccount(src/features/integrations/server/accounts.ts)\n\n312 events · 41 users affected\n\nFirst seen 3 hours ago",
  },
  {
    externalId: "issue:demo-2",
    source: "sentry",
    kind: "error",
    priority: "high",
    minutesAgo: 70,
    actions: GITHUB_ACTIONS,
    title: "SlackApiError: ratelimited",
    sender: { name: "personal-dashboard", handle: "DASHBOARD-7" },
    body: "fatal in personal-dashboard\n\nCulprit: slack/client.ts in request\n\n58 events · 9 users affected\n\nFirst seen yesterday",
  },
  {
    externalId: "issue:demo-3",
    source: "sentry",
    kind: "error",
    priority: "normal",
    minutesAgo: 400,
    actions: GITHUB_ACTIONS,
    title: "Hydration mismatch in <CalendarApp>",
    sender: { name: "personal-dashboard", handle: "DASHBOARD-3" },
    body: "warning in personal-dashboard\n\nCulprit: calendar-app.tsx\n\n17 events · 5 users affected\n\nFirst seen 2 days ago",
  },
];

const BY_SOURCE: Record<Source, SeedItem[]> = {
  slack: SLACK,
  gmail: GMAIL,
  calendar: CALENDAR,
  github: GITHUB,
  vercel: VERCEL,
  sentry: SENTRY,
};

export const seedItems = (source: Source, now: Date): FeedItem[] =>
  BY_SOURCE[source].map((seed) => toFeedItem(seed, now));
export const incomingItems = (source: Source, now: Date): FeedItem[] =>
  INCOMING.filter((seed) => seed.source === source).map((seed) => toFeedItem(seed, now));
