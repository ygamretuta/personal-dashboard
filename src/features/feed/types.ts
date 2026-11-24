import { Source } from "@/generated/prisma/enums";
import type { FeedItemKind, ItemStatus, Priority } from "@/generated/prisma/enums";

// Domain enums come from the Prisma schema, the single source of truth.
export type { FeedItemKind, ItemStatus, Priority, Source };
export const SOURCES: Source[] = Object.values(Source);

export type ActionType = "reply" | "archive" | "snooze" | "markRead" | "open";

export interface FeedReply {
  id: string;
  text: string;
  sentAt: string;
}

/** The one shape the UI knows about. Raw API payloads never leave their adapter. */
export interface FeedItem {
  id: string; // `${source}:${externalId}`
  source: Source;
  kind: FeedItemKind;
  externalId: string;
  title: string;
  preview: string; // plain text, at most PREVIEW_MAX_CHARS
  body: string; // full plain-text body for the detail pane
  sender: { name: string; avatarUrl?: string; handle?: string };
  url: string; // deep link back to the source app
  receivedAt: string; // ISO
  dueAt?: string;
  priority: Priority;
  status: ItemStatus;
  snoozedUntil?: string;
  actions: ActionType[];
  replies: FeedReply[];
}

export interface ActionPayload {
  text?: string; // reply
  until?: string; // snooze, ISO
}

export type SourceFilter = Source | "all";
