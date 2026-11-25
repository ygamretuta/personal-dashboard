import Image from "next/image";
import Link from "next/link";
import { Kbd } from "@/components/ui/kbd";
import { SOURCE_CONFIG } from "@/features/feed/sources";
import { SOURCES } from "@/features/feed/types";
import { SHORTCUTS } from "@/features/shortcuts/shortcuts";

const HIGHLIGHTS: (keyof typeof SHORTCUTS)[] = ["next", "archive", "reply", "commandPalette"];
const SCREENSHOT_SIZE = { width: 1440, height: 900 };

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-14">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-muted">☀️ Morning</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Slack, Gmail, Calendar and GitHub in one quiet inbox.
        </h1>
        <p className="text-lg text-muted text-pretty">
          Triage everything that needs you before your first coffee gets cold, without leaving the
          keyboard.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Link href="/demo" className="btn btn-primary px-4 py-2 text-base">
          Try the demo
        </Link>
        <span className="text-sm text-muted">No sign-up. Loads in seconds.</span>
        <Link href="/dashboard" className="text-sm text-muted underline">
          See the dashboard
        </Link>
        <Link href="/inbox" className="text-sm text-muted underline">
          Sign in
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border shadow-xl">
        <Image
          src="/screenshots/inbox-light.png"
          alt="The Morning inbox: a feed on the left, the selected email on the right"
          className="light-only h-auto w-full"
          priority
          {...SCREENSHOT_SIZE}
        />
        <Image
          src="/screenshots/inbox-dark.png"
          alt="The Morning inbox in dark mode"
          className="dark-only h-auto w-full"
          priority
          {...SCREENSHOT_SIZE}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          {SOURCES.map((source) => {
            const { icon: Icon, label, accentClass } = SOURCE_CONFIG[source];
            return (
              <li key={source} className="flex items-center gap-1.5">
                <Icon size={16} className={accentClass} aria-hidden /> {label}
              </li>
            );
          })}
        </ul>
        <ul className="flex flex-wrap gap-3 text-sm">
          {HIGHLIGHTS.map((id) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5"
            >
              {SHORTCUTS[id].label}
              <Kbd keys={SHORTCUTS[id].keys} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
