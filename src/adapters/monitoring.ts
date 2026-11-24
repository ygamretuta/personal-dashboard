import * as Sentry from "@sentry/nextjs";

export type ErrorContext = Record<string, string | number | boolean | undefined>;

/** The only way feature code reports errors; vendor details stay in this file. */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  Sentry.captureException(error, { extra: context });
}
