import { SOURCE_CONFIG } from "../sources";
import type { Source } from "../types";

export function SourceIcon({ source, size = 16 }: { source: Source; size?: number }) {
  const { icon: Icon, accentClass, label } = SOURCE_CONFIG[source];
  return <Icon aria-label={label} size={size} className={`shrink-0 ${accentClass}`} />;
}
