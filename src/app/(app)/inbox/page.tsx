import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUserId } from "@/adapters/auth";
import { FeedList } from "@/features/feed/components/feed-list";
import { InboxApp } from "@/features/inbox/inbox-app";

const SIGN_IN_URL = "/api/auth/signin?callbackUrl=%2Finbox";

async function LiveInbox() {
  if (!(await getCurrentUserId())) redirect(SIGN_IN_URL);
  return <InboxApp mode="live" />;
}

export default function InboxPage() {
  return (
    <Suspense fallback={<FeedList items={null} freshIds={[]} now={0} onSelect={() => {}} />}>
      <LiveInbox />
    </Suspense>
  );
}
