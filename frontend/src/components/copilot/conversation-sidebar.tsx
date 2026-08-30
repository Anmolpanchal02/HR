"use client";

import { IconPlus, IconX } from "@/components/icons";
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
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  className?: string;
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
  mobileOpen,
  onMobileClose,
  className,
}: ConversationSidebarProps) {
  const groups = groupConversations(conversations);

  function select(id: string) {
    onSelect(id);
    onMobileClose?.();
  }

  function createNew() {
    onNew();
    onMobileClose?.();
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="absolute inset-0 z-30 bg-overlay backdrop-blur-[1px] lg:hidden"
          aria-label="Close history"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "z-40 flex h-full w-[min(18rem,85vw)] shrink-0 flex-col border-r border-border bg-background",
          "",
          "absolute inset-y-0 left-0 transition-transform duration-200 lg:static lg:w-72 lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none",
          className,
        )}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Button onClick={createNew} className="flex-1" size="sm">
            <IconPlus />
            New chat
          </Button>
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted lg:hidden"
            aria-label="Close history"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 px-1 py-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-9 animate-pulse rounded-xl bg-surface-muted"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
              No chats yet. Start a conversation to see history here.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((conversation) => (
                    <li key={conversation.id} className="group relative flex items-center">
                      <button
                        type="button"
                        onClick={() => select(conversation.id)}
                        className={cn(
                          "w-full truncate rounded-xl px-3 py-2 pr-8 text-left text-sm transition-colors",
                          activeId === conversation.id
                            ? "bg-surface font-medium text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
                        )}
                      >
                        {conversation.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(conversation.id)}
                        className="absolute right-1.5 rounded-md px-1.5 py-1 text-sm text-subtle-foreground opacity-0 transition-opacity hover:bg-destructive-soft hover:text-destructive group-hover:opacity-100"
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
    </>
  );
}
