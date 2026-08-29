"use client";

import { IconPlus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { ConversationListItem } from "@/types/copilot";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: ConversationListItem[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function groupConversations(conversations: ConversationListItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: ConversationListItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const c of conversations) {
    const d = new Date(c.updatedAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups[0]!.items.push(c);
    else if (d.getTime() === yesterday.getTime()) groups[1]!.items.push(c);
    else groups[2]!.items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}

export function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: ConversationSidebarProps) {
  const groups = groupConversations(conversations);

  return (
    <aside className="flex h-full w-full flex-col border-r border-zinc-200 bg-zinc-50/50 lg:w-72">
      <div className="border-b border-zinc-200 p-3">
        <Button onClick={onNew} className="w-full" size="sm">
          <IconPlus />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-4 text-xs text-zinc-400">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-xs text-zinc-500">No conversations yet. Start a new chat.</p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((conversation) => (
                  <li key={conversation.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelect(conversation.id)}
                      className={cn(
                        "flex-1 truncate rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        activeId === conversation.id
                          ? "bg-white font-medium text-zinc-900 shadow-sm"
                          : "text-zinc-600 hover:bg-white/80 hover:text-zinc-900",
                      )}
                    >
                      {conversation.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(conversation.id)}
                      className="rounded px-1.5 py-1 text-xs text-zinc-300 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                      aria-label={`Delete ${conversation.title}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
