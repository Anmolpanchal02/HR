"use client";

import { IconMoon, IconSun } from "@/components/icons";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact }: ThemeToggleProps) {
  const { resolvedTheme, toggleLightDark } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleLightDark}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-colors",
        compact
          ? "h-9 w-9 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          : "gap-2 border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}

export function ThemePreferenceButtons() {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: "light" as const, label: "Light" },
    { id: "dark" as const, label: "Dark" },
    { id: "system" as const, label: "System" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-surface-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
