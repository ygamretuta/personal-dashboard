import { db } from "@/db/client";

export interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function saveSubscription(userId: string, input: SubscriptionInput) {
  await db.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    update: { userId, p256dh: input.p256dh, auth: input.auth },
    create: { userId, ...input },
  });
}

export async function removeSubscription(userId: string, endpoint: string) {
  await db.pushSubscription.deleteMany({ where: { userId, endpoint } });
}
