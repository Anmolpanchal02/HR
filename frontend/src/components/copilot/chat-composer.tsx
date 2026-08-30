"use client";

import { useEffect, useRef } from "react";

import { IconSend } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  loading,
  placeholder = "Message Copilot…",
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && !loading && Boolean(value.trim());

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <div className="bg-gradient-to-t from-background via-background/95 to-transparent px-3 pb-3 pt-2 md:px-6 md:pb-5">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm",
            "focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15",
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            rows={1}
            className={cn(
              "max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground",
              "placeholder:text-subtle-foreground focus:outline-none disabled:opacity-50",
            )}
            aria-label="Message input"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                : "bg-surface-muted text-subtle-foreground",
              loading && "opacity-70",
            )}
          >
            {loading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
            ) : (
              <IconSend className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 hidden text-center text-[11px] text-subtle-foreground sm:block">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}
