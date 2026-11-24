import { CalendarDays, GitPullRequest, Hash, Mail, type LucideIcon } from "lucide-react";
import type { Source } from "./types";

interface SourceConfig {
  label: string;
  icon: LucideIcon;
  accentClass: string; // text color token
  openLabel: string;
  archiveLabel: string;
}

/** Everything the UI needs to know about a source lives here, keyed by source. */
export const SOURCE_CONFIG: Record<Source, SourceConfig> = {
  slack: {
    label: "Slack",
    icon: Hash,
    accentClass: "text-source-slack",
    openLabel: "Open in Slack",
    archiveLabel: "Archive",
  },
  gmail: {
    label: "Gmail",
    icon: Mail,
    accentClass: "text-source-gmail",
    openLabel: "Open in Gmail",
    archiveLabel: "Archive",
  },
  calendar: {
    label: "Calendar",
    icon: CalendarDays,
    accentClass: "text-source-calendar",
    openLabel: "Join meeting",
    archiveLabel: "Dismiss",
  },
  github: {
    label: "GitHub",
    icon: GitPullRequest,
    accentClass: "text-source-github",
    openLabel: "Open on GitHub",
    archiveLabel: "Mark done",
  },
};
