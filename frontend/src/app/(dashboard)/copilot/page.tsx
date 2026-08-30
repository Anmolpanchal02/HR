"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatComposer } from "@/components/copilot/chat-composer";
import { ConversationSidebar } from "@/components/copilot/conversation-sidebar";
import { CopilotEmptyState } from "@/components/copilot/copilot-empty-state";
import { MessageBubble, ThinkingIndicator } from "@/components/copilot/message-bubble";
import {
  deleteConversation,
  getConversation,
  listConversations,
  sendChatMessage,
} from "@/lib/api/copilot.api";
import { ApiError } from "@/lib/api/client";
import type { CopilotMessage, ConversationListItem } from "@/types/copilot";

export default function CopilotPage() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const response = await listConversations();
      setConversations(response.data.conversations);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const response = await getConversation(id);
    setMessages(response.data.conversation.messages);
    setActiveConversationId(id);
    setError(null);
  }, []);

  useEffect(() => {
    // Data fetch on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load conversations from API
    void loadConversations().catch(() => setError("Failed to load conversations"));
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(messageOverride?: string) {
    const trimmed = (messageOverride ?? input).trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    const optimisticUserMessage: CopilotMessage = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput("");

    try {
      const response = await sendChatMessage({
        message: trimmed,
        conversationId: activeConversationId ?? undefined,
      });

      setActiveConversationId(response.data.conversationId);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMessage.id),
        { ...optimisticUserMessage, id: `user-${Date.now()}` },
        { ...response.data.message, toolCalls: response.data.toolCalls },
      ]);
      await loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id));
      setInput(trimmed);
      setError(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }

  async function handleDeleteConversation(id: string) {
    try {
      await deleteConversation(id);
      if (activeConversationId === id) handleNewChat();
      await loadConversations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete conversation");
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              AI Copilot
            </h2>
            <span className="hidden rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-soft-foreground sm:inline">
              Agent
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            Ask questions or get work done across your org
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-background lg:hidden"
          >
            History
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover lg:hidden"
          >
            New
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          loading={conversationsLoading}
          onSelect={(id) => void loadConversation(id)}
          onNew={handleNewChat}
          onDelete={(id) => void handleDeleteConversation(id)}
          mobileOpen={historyOpen}
          onMobileClose={() => setHistoryOpen(false)}
        />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {messages.length === 0 && !loading ? (
              <CopilotEmptyState onExampleClick={(prompt) => void handleSend(prompt)} />
            ) : (
              <div className="mx-auto max-w-3xl space-y-7">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {loading && <ThinkingIndicator />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
              <div
                className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive-foreground"
                role="alert"
              >
                <p className="min-w-0 flex-1 leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 text-xs font-medium text-destructive hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => void handleSend()}
            loading={loading}
            disabled={loading}
          />
        </section>
      </div>
    </div>
  );
}
