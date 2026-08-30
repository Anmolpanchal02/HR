"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { IconMenu } from "@/components/icons";
import { RoleBadge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/providers/auth-provider";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/copilot": "AI Copilot",
  "/members": "Members",
  "/employees": "Employees",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/documents": "Knowledge Base",
  "/engineering": "Engineering",
  "/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/employees/")) return "Employee Profile";
  if (pathname.startsWith("/projects/")) return "Project Details";
  if (pathname.startsWith("/documents/")) return "Document Details";
  return "HR Copilot";
}

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTitle = pathname === "/copilot";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const title = resolveTitle(pathname);
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <IconMenu />
        </button>
        {!hideTitle && (
          <h1 className="text-sm font-semibold tracking-tight text-foreground lg:text-base">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle compact />

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-surface-muted"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <div className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 z-50 mt-1.5 w-56 rounded-2xl border border-border bg-surface py-1 shadow-md"
                role="menu"
              >
                <div className="border-b border-border px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  <div className="mt-1.5">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/settings");
                  }}
                >
                  Profile & Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive-soft"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout().then(() => router.push("/login"));
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
