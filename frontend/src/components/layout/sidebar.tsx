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
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: <IconDashboard /> }],
  },
  {
    title: "AI",
    items: [{ href: "/copilot", label: "Copilot", icon: <IconCopilot /> }],
  },
  {
    title: "People",
    items: [
      { href: "/members", label: "Members", icon: <IconUsers /> },
      { href: "/employees", label: "Employees", icon: <IconUsers /> },
    ],
  },
  {
    title: "Work",
    items: [
      { href: "/projects", label: "Projects", icon: <IconFolder /> },
      { href: "/tasks", label: "Tasks", icon: <IconCheckSquare /> },
    ],
  },
  {
    title: "Knowledge",
    items: [{ href: "/documents", label: "Documents", icon: <IconDocument /> }],
  },
  {
    title: "Engineering",
    items: [{ href: "/engineering", label: "Engineering", icon: <IconCode /> }],
  },
];

const bottomNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: <IconSettings /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
          <IconCopilot className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">HR Copilot</p>
          <p className="truncate text-xs text-zinc-500">AI Engineering</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
          aria-label="Close menu"
        >
          <IconX />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {navigation.map((section) => (
          <div key={section.title ?? "root"} className="mb-4 last:mb-0">
            {section.title && (
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
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
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className={cn(active ? "text-zinc-900" : "text-zinc-400")}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-200 px-3 py-3">
        {bottomNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
              )}
            >
              <span className={cn(active ? "text-zinc-900" : "text-zinc-400")}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] border-r border-zinc-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {content}
      </aside>
    </>
  );
}
