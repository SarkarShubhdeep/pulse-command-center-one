"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
    id: string;
    user_id: string;
    user_name: string;
    message: string;
    mentioned_user_ids: string[] | null;
    created_at: string;
    pending?: boolean;
}

interface UseChatReturn {
    messages: ChatMessage[];
    loading: boolean;
    error: Error | null;
    sendMessage: (
        message: string,
        userId: string,
        userName: string,
        mentionedIds?: string[]
    ) => Promise<void>;
    sending: boolean;
    unreadCount: number;
    hasMentions: boolean;
    markAsRead: () => void;
}

export function useChat(currentUserId?: string): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [sending, setSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasMentions, setHasMentions] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        const fetchMessages = async () => {
            try {
                const { data, error: err } = await supabase
                    .from("chat_messages")
                    .select("*")
                    .order("created_at", { ascending: true })
                    .limit(100);

                if (err) {
                    setError(err);
                    setMessages([]);
                } else {
                    setMessages(data || []);
                    setError(null);

                    // Initialize unread count and mentions on load
                    const unreadMessages = data.filter(
                        (m) => m.user_id !== currentUserId
                    );
                    setUnreadCount(unreadMessages.length);
                    const mentionedMessages = unreadMessages.filter((m) =>
                        m.mentioned_user_ids?.includes(currentUserId)
                    );
                    setHasMentions(mentionedMessages.length > 0);
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err : new Error("Unknown error")
                );
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        const subscription = supabase
            .channel("chat-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                },
                (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    setMessages((prev) => {
                        const exists = prev.some((m) => m.id === newMessage.id);
                        if (!exists) {
                            return [...prev, newMessage];
                        }
                        return prev;
                    });

                    if (currentUserId && newMessage.user_id !== currentUserId) {
                        setUnreadCount((prev) => prev + 1);
                        if (
                            newMessage.mentioned_user_ids?.includes(
                                currentUserId
                            )
                        ) {
                            setHasMentions(true);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [currentUserId]);

    const sendMessage = useCallback(
        async (
            message: string,
            userId: string,
            userName: string,
            mentionedIds?: string[]
        ) => {
            if (!message.trim() || !userId) return;

            const tempId = `temp-${Date.now()}`;
            const optimisticMessage: ChatMessage = {
                id: tempId,
                user_id: userId,
                user_name: userName,
                message: message.trim(),
                mentioned_user_ids:
                    mentionedIds && mentionedIds.length > 0
                        ? mentionedIds
                        : null,
                created_at: new Date().toISOString(),
                pending: true,
            };

            setMessages((prev) => [...prev, optimisticMessage]);
            setSending(true);

            try {
                const supabase = createClient();
                const { data, error: err } = await supabase
                    .from("chat_messages")
                    .insert({
                        user_id: userId,
                        user_name: userName,
                        message: message.trim(),
                        mentioned_user_ids:
                            mentionedIds && mentionedIds.length > 0
                                ? mentionedIds
                                : null,
                    })
                    .select()
                    .single();

                if (err) {
                    console.error("Error sending message:", err);
                    setMessages((prev) => prev.filter((m) => m.id !== tempId));
                    setError(err);
                } else if (data) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === tempId ? { ...data, pending: false } : m
                        )
                    );
                }
            } catch (err) {
                console.error("Error:", err);
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
                setError(
                    err instanceof Error ? err : new Error("Unknown error")
                );
            } finally {
                setSending(false);
            }
        },
        []
    );

    const markAsRead = useCallback(() => {
        setUnreadCount(0);
        setHasMentions(false);
    }, []);

    return {
        messages,
        loading,
        error,
        sendMessage,
        sending,
        unreadCount,
        hasMentions,
        markAsRead,
    };
}
