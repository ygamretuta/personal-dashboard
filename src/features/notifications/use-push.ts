"use client";

import { useEffect, useState } from "react";

export type PushState = "loading" | "unsupported" | "blocked" | "off" | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const SERVICE_WORKER_URL = "/sw.js";

/** The subscribe endpoint wants the key as bytes, not base64url text. */
function keyToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), "=");
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

const isSupported = () =>
  typeof window !== "undefined" &&
  Boolean(PUBLIC_KEY) &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

async function currentSubscription() {
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  await navigator.serviceWorker.ready;
  return { registration, subscription: await registration.pushManager.getSubscription() };
}

async function post(method: "POST" | "DELETE", body: unknown) {
  const response = await fetch("/api/push/subscribe", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Push subscription request failed");
}

export function usePush() {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    const detect = async (): Promise<PushState> => {
      if (!isSupported()) return "unsupported";
      if (Notification.permission === "denied") return "blocked";
      try {
        return (await currentSubscription()).subscription ? "on" : "off";
      } catch {
        return "unsupported";
      }
    };
    void detect().then(setState);
  }, []);

  const enable = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setState("blocked");
    const { registration } = await currentSubscription();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyToBytes(PUBLIC_KEY as string),
    });
    await post("POST", subscription.toJSON());
    setState("on");
  };

  const disable = async () => {
    const { subscription } = await currentSubscription();
    if (!subscription) return setState("off");
    await post("DELETE", { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
    setState("off");
  };

  return { state, enable, disable };
}
