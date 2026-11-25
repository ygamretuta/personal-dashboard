"use client";

import { BarChart3, CalendarDays, FlaskConical, Inbox, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/use-theme";

const NAV_LINKS = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/demo", label: "Demo", icon: FlaskConical },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppRail() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <nav
      aria-label="Main"
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-panel py-3"
    >
      <Link href="/" aria-label="Morning home" className="mb-3 text-lg">
        ☀️
      </Link>
      {NAV_LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          aria-current={pathname === href ? "page" : undefined}
          className={`rounded-md p-2 ${pathname === href ? "bg-selected text-primary" : "text-muted hover:bg-hover"}`}
        >
          <Icon size={18} aria-hidden />
        </Link>
      ))}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="mt-auto rounded-md p-2 text-muted hover:bg-hover"
      >
        <ThemeIcon size={18} aria-hidden />
      </button>
    </nav>
  );
}
