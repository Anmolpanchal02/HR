/**
 * Theme token reference (source of truth: src/styles/theme-tokens.css)
 *
 * Use Tailwind semantic classes mapped from CSS variables — they auto-switch
 * with light/dark. Prefer these over slate-/zinc-/indigo-* utilities.
 */
export const themeTokens = {
  canvas: ["bg-background", "text-foreground"],
  surface: ["bg-surface", "bg-surface-muted", "bg-surface-hover", "bg-surface-elevated"],
  text: ["text-foreground", "text-muted-foreground", "text-subtle-foreground"],
  border: ["border-border", "border-border-strong"],
  brand: [
    "bg-primary",
    "text-primary",
    "text-primary-foreground",
    "bg-primary-soft",
    "text-primary-soft-foreground",
    "bg-brand-gradient",
  ],
  status: [
    "bg-success-soft",
    "text-success",
    "bg-warning-soft",
    "text-warning",
    "bg-destructive-soft",
    "text-destructive",
    "bg-info-soft",
    "text-info",
  ],
  sidebar: [
    "bg-sidebar",
    "text-sidebar-foreground",
    "text-sidebar-muted",
    "bg-sidebar-active",
    "text-sidebar-active-foreground",
  ],
} as const;
