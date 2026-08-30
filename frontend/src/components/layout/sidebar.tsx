"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IconCheckSquare,
  IconCode,
  IconCopilot,
  IconDashboard,
  IconDocument,
  IconFolder,
  IconSettings,
  IconUsers,
  IconX,
} from "@/components/icons";
import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { navigationForRole, type NavItem } from "@/types/permissions";

const ICONS = {
  dashboard: <IconDashboard />,
  copilot: <IconCopilot />,
  users: <IconUsers />,
  folder: <IconFolder />,
  tasks: <IconCheckSquare />,
  document: <IconDocument />,
  code: <IconCode />,
  settings: <IconSettings />,
} as const;

function navClass(active: boolean) {
  return cn(
    "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
  );
}

function NavLink({
  item,
  active,
  onClose,
}: {
  item: NavItem;
  active: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={navClass(active)}
      aria-current={active ? "page" : undefined}
    >
      <span className={active ? "text-sidebar-active-icon" : "text-sidebar-muted"}>
        {ICONS[item.iconKey]}
      </span>
      {item.label}
    </Link>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navigation = user ? navigationForRole(user.role) : [];

  const content = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <BrandMark compact inverted className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground lg:hidden"
          aria-label="Close menu"
        >
          <IconX />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {navigation.map((section) => (
          <div key={section.title ?? "root"} className="mb-5 last:mb-0">
            {section.title && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                return (
                  <li key={`${section.title}-${item.label}`}>
                    <NavLink item={item} active={active} onClose={onClose} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <NavLink
          item={{ href: "/settings", label: "Settings", iconKey: "settings" }}
          active={pathname.startsWith("/settings")}
          onClose={onClose}
        />
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] overflow-hidden transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {content}
      </aside>
    </>
  );
}
