"use client";

import { useEffect, useRef } from "react";

import { IconSend } from "@/components/icons";
import { Button } from "@/components/ui/button";
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
  placeholder = "Ask anything about your organization...",
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading && value.trim()) onSend();
    }
  }

  return (
    <div className="border-t border-zinc-200 bg-white p-3 md:p-4">
      <div className="flex items-end gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2 focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-100">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={1}
          className={cn(
            "max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-900",
            "placeholder:text-zinc-400 focus:outline-none disabled:opacity-50",
          )}
          aria-label="Message input"
        />
        <Button
          size="sm"
          onClick={onSend}
          disabled={disabled || loading || !value.trim()}
          loading={loading}
          aria-label="Send message"
          className="shrink-0"
        >
          <IconSend />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
      <p className="mt-1.5 hidden text-xs text-zinc-400 sm:block">
        Enter to send · Shift + Enter for new line
      </p>
    </div>
  );
}
