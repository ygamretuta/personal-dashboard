import * as webpush from "web-push";

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushMessage {
  title: string;
  body: string;
  url: string;
}

export type PushResult = "sent" | "gone" | "failed";

const GONE_STATUS_CODES = [404, 410];

/** Push needs a VAPID key pair; without it notifications are simply unavailable. */
export function isPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT,
  );
}

/** Sends one Web Push message. "gone" means the browser unsubscribed and the row can be deleted. */
export async function sendPush(target: PushTarget, message: PushMessage): Promise<PushResult> {
  if (!isPushConfigured()) return "failed";
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(message),
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    return status && GONE_STATUS_CODES.includes(status) ? "gone" : "failed";
  }
}
