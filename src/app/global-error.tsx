"use client";

import { useEffect } from "react";
import { captureError } from "@/adapters/monitoring";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureError(error, { area: "app", boundary: "global-error.tsx", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <h1>Something went wrong</h1>
        <p>We have been notified. Please reload the page.</p>
      </body>
    </html>
  );
}
