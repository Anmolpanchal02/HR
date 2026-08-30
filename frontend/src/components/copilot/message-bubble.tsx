"use client";

import type { CopilotMessage } from "@/types/copilot";
import { CitationCards } from "./citation-card";
import { ToolActivity } from "./tool-activity";

interface MessageBubbleProps {
  message: CopilotMessage;
}

function AssistantAvatar() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-from to-brand-to text-[10px] font-semibold tracking-wide text-white shadow-sm"
      aria-hidden
    >
      AI
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "USER";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(100%,36rem)] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 max-w-[min(100%,40rem)] flex-1 pt-0.5">
        <p className="mb-1 text-xs font-medium text-subtle-foreground">Copilot</p>
        <div className="text-sm leading-relaxed text-foreground">
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.toolCalls && message.toolCalls.length > 0 && (
            <ToolActivity toolCalls={message.toolCalls} />
          )}
          {message.citations && message.citations.length > 0 && (
            <CitationCards citations={message.citations} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="pt-0.5">
        <p className="mb-1 text-xs font-medium text-subtle-foreground">Copilot</p>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
          <span className="flex gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </span>
          Thinking…
        </div>
      </div>
    </div>
  );
}
