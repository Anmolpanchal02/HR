import type { UserRole } from "@/types/auth";

export function canAccessMembers(role: UserRole): boolean {
  return role === "ADMIN" || role === "HR";
}

export function canAccessEmployeeDirectory(role: UserRole): boolean {
  return role === "ADMIN" || role === "HR";
}

export function isPeopleOpsRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "HR";
}

export function canReviewLeave(role: UserRole, hasDirectReports?: boolean): boolean {
  return isPeopleOpsRole(role) || Boolean(hasDirectReports);
}

export function canViewTeamAttendance(_role: UserRole, hasDirectReports?: boolean): boolean {
  return Boolean(hasDirectReports);
}

export function canViewEmployeeProfile(
  role: UserRole,
  viewerEmployeeId: string | undefined,
  targetEmployeeId: string,
): boolean {
  if (isPeopleOpsRole(role)) return true;
  return Boolean(viewerEmployeeId && viewerEmployeeId === targetEmployeeId);
}

export function isEmployeeRole(role: UserRole): boolean {
  return role === "EMPLOYEE";
}

export interface NavItem {
  href: string;
  label: string;
  iconKey:
    | "dashboard"
    | "copilot"
    | "users"
    | "folder"
    | "tasks"
    | "document"
    | "code"
    | "settings"
    | "clock"
    | "calendar"
    | "org";
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export function navigationForRole(role: UserRole): NavSection[] {
  const sections: NavSection[] = [
    {
      items: [{ href: "/dashboard", label: "Dashboard", iconKey: "dashboard" }],
    },
    {
      title: "AI",
      items: [{ href: "/copilot", label: "Copilot", iconKey: "copilot" }],
    },
    {
      title: "HR & CRM",
      items: [
        { href: "/attendance", label: "Attendance", iconKey: "clock" },
        { href: "/leave", label: "Leave", iconKey: "calendar" },
        { href: "/org-chart", label: "Org chart", iconKey: "org" },
      ],
    },
  ];

  if (canAccessMembers(role) || canAccessEmployeeDirectory(role)) {
    const people: NavItem[] = [];
    if (canAccessMembers(role)) {
      people.push({ href: "/members", label: "Members", iconKey: "users" });
    }
    if (canAccessEmployeeDirectory(role)) {
      people.push({ href: "/employees", label: "Employees", iconKey: "users" });
    }
    sections.push({ title: "People", items: people });
  }

  sections.push({
    title: "Work",
    items: [
      { href: "/projects", label: "Projects", iconKey: "folder" },
      { href: "/tasks", label: "Tasks", iconKey: "tasks" },
    ],
  });

  sections.push({
    title: "Knowledge",
    items: [{ href: "/documents", label: "Documents", iconKey: "document" }],
  });

  if (role === "ADMIN" || role === "HR" || role === "ENGINEER") {
    sections.push({
      title: "Engineering",
      items: [{ href: "/engineering", label: "Engineering", iconKey: "code" }],
    });
  }

  return sections;
}
