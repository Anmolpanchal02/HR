"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatComposer } from "@/components/copilot/chat-composer";
import { ConversationSidebar } from "@/components/copilot/conversation-sidebar";
import { CopilotEmptyState } from "@/components/copilot/copilot-empty-state";
import { MessageBubble, ThinkingIndicator } from "@/components/copilot/message-bubble";
import { ErrorState } from "@/components/ui/error-state";
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
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] flex-col md:-m-6 lg:-m-8">
      <div className="border-b border-zinc-200 bg-white px-4 py-3 md:px-6">
        <h2 className="text-base font-semibold text-zinc-900">AI Copilot</h2>
        <p className="text-sm text-zinc-500">Ask questions or get work done across your organization</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          loading={conversationsLoading}
          onSelect={(id) => void loadConversation(id)}
          onNew={handleNewChat}
          onDelete={(id) => void handleDeleteConversation(id)}
        />

        <section className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
            {messages.length === 0 && !loading ? (
              <CopilotEmptyState onExampleClick={(prompt) => void handleSend(prompt)} />
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {loading && <ThinkingIndicator />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 pb-2 md:px-6">
              <ErrorState message={error} onRetry={() => setError(null)} />
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
