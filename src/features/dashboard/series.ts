import type { Source } from "@/features/feed/types";

/** Fixed chart color per source (color follows the entity, never its rank). Slots are the validated palette's first five. */
export const SOURCE_SERIES: Record<Source, string> = {
  slack: "var(--chart-1)",
  gmail: "var(--chart-2)",
  calendar: "var(--chart-3)",
  github: "var(--chart-4)",
  vercel: "var(--chart-5)",
};
