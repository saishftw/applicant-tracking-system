import type { ReactNode } from "react";
import { LeftRail } from "./LeftRail";
import { TopBar } from "./TopBar";
import { Toast } from "./Toast";
import { CommsDraftModal } from "@/overlays/CommsDraftModal";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900">
      <LeftRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <Toast />
      <CommsDraftModal />
    </div>
  );
}
