import { Suspense } from "react";
import { FeedList } from "@/features/feed/components/feed-list";
import { InboxApp } from "@/features/inbox/inbox-app";

// The demo reads the clock on the client, so it streams in behind a skeleton.
export default function DemoPage() {
  return (
    <Suspense fallback={<FeedList items={null} freshIds={[]} now={0} onSelect={() => {}} />}>
      <InboxApp mode="demo" />
    </Suspense>
  );
}
