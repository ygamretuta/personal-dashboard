import type { ReactNode } from "react";
import { AppRail } from "@/components/app-rail";
import { ToastProvider } from "@/components/ui/toast";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-dvh">
        <AppRail />
        <main className="flex min-w-0 flex-1">{children}</main>
      </div>
    </ToastProvider>
  );
}
