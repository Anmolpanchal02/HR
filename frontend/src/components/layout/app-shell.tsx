"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fullBleed = pathname === "/copilot";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden w-[var(--sidebar-width)] bg-sidebar lg:block" />
        <div className="flex flex-1 flex-col">
          <div className="h-14 border-b border-border bg-surface/80" />
          <div className="flex-1 p-6">
            <PageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main
          className={
            fullBleed
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          }
        >
          {fullBleed ? children : <div className="mx-auto w-full max-w-7xl">{children}</div>}
        </main>
      </div>
    </div>
  );
}
