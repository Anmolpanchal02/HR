"use client";

import type { CopilotMessage } from "@/types/copilot";
import { CitationCards } from "./citation-card";
import { ToolActivity } from "./tool-activity";

interface MessageBubbleProps {
  message: CopilotMessage;
}

function AssistantAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-bold text-white">
      AI
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "USER";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 max-w-[85%] flex-1">
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms]" />
          </span>
          Working on your request...
        </div>
      </div>
    </div>
  );
}
