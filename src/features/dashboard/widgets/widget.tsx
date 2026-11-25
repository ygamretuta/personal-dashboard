import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

interface WidgetProps {
  title: string;
  icon?: LucideIcon;
  /** Small control or link on the right of the title. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Widget({ title, icon: Icon, action, className = "", children }: WidgetProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={`flex min-w-0 flex-col rounded-xl border border-border bg-panel p-4 ${className}`}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 id={headingId} className="flex items-center gap-1.5 text-sm font-medium">
          {Icon && <Icon size={14} className="text-muted" aria-hidden />}
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function WidgetLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
    >
      {children}
    </a>
  );
}

export const EmptyNote = ({ children }: { children: ReactNode }) => (
  <p className="py-2 text-sm text-muted">{children}</p>
);
