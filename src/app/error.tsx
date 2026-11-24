"use client";

import { useEffect } from "react";
import { captureError } from "@/adapters/monitoring";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { area: "app", boundary: "error.tsx", digest: error.digest });
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted">We have been notified. Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Try again
      </button>
    </main>
  );
}
