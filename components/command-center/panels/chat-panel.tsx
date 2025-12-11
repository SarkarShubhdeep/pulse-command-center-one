"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { useUsersList } from "@/hooks/use-users-list";

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

interface MentionSuggestion {
    id: string;
    name: string;
}

export function ChatPanel({
    isOpen,
    onClose,
    userId,
    userName,
}: ChatPanelProps) {
    const [inputMessage, setInputMessage] = useState("");
    const { messages, loading, sendMessage, sending, markAsRead } =
        useChat(userId);
    const { online, offline } = useUsersList();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [selectedMentions, setSelectedMentions] = useState<
        MentionSuggestion[]
    >([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const allUsers = [...online, ...offline].filter((u) => u.id !== userId);

    const getMentionSuggestions = (query: string): MentionSuggestion[] => {
        if (!query) return [];
        return allUsers
            .filter((u) =>
                u.full_name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 3)
            .map((u) => ({ id: u.id, name: u.full_name }));
    };

    const mentionSuggestions = getMentionSuggestions(mentionQuery);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            markAsRead();
        }
    }, [isOpen, markAsRead]);

    const insertMention = (mention: MentionSuggestion) => {
        const beforeAt = inputMessage.substring(0, mentionIndex);
        const afterQuery = inputMessage.substring(
            mentionIndex + mentionQuery.length + 1
        );
        const newMessage = `${beforeAt}@${mention.name} ${afterQuery}`;
        setInputMessage(newMessage);
        setSelectedMentions((prev) => [...prev, mention]);
        setShowMentions(false);
        setMentionQuery("");
        inputRef.current?.focus();
    };

    const handleSend = async () => {
        if (!inputMessage.trim() || sending) return;
        const msg = inputMessage;
        const mentionedIds = selectedMentions.map((m) => m.id);
        setInputMessage("");
        setSelectedMentions([]);
        await sendMessage(msg, userId, userName, mentionedIds);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && mentionSuggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((prev) =>
                    prev < mentionSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex((prev) =>
                    prev > 0 ? prev - 1 : mentionSuggestions.length - 1
                );
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (mentionIndex >= 0) {
                    insertMention(mentionSuggestions[mentionIndex]);
                }
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputMessage(value);

        const lastAtIndex = value.lastIndexOf("@");
        if (lastAtIndex !== -1) {
            const afterAt = value.substring(lastAtIndex + 1);
            const spaceIndex = afterAt.indexOf(" ");

            if (spaceIndex === -1) {
                setMentionIndex(-1);
                setMentionQuery(afterAt);
                setShowMentions(true);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
            setMentionQuery("");
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!isOpen) return null;

    const renderMessageWithMentions = (message: string) => {
        const mentionRegex = /@([\w\s]+)/g;
        const parts: (string | JSX.Element)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(message)) !== null) {
            if (match.index > lastIndex) {
                parts.push(message.substring(lastIndex, match.index));
            }
            parts.push(
                <span key={match.index} className="font-semibold text-blue-500">
                    @{match[1]}
                </span>
            );
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < message.length) {
            parts.push(message.substring(lastIndex));
        }

        return parts.length > 0 ? parts : message;
    };

    return (
        <Card className="w-80 h-[500px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
            <CardHeader className="py-3 px-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                        Team Chat
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.user_id === userId;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2 ${
                                        isMe ? "flex-row-reverse" : "flex-row"
                                    } ${msg.pending ? "opacity-60" : ""}`}
                                >
                                    <Avatar className="h-7 w-7 flex-shrink-0">
                                        <AvatarFallback className="text-xs">
                                            {getInitials(msg.user_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className={`max-w-[70%] ${
                                            isMe ? "items-end" : "items-start"
                                        }`}
                                    >
                                        <div
                                            className={`text-xs mb-1 ${
                                                isMe
                                                    ? "text-right"
                                                    : "text-left"
                                            } text-muted-foreground`}
                                        >
                                            {isMe ? "You" : msg.user_name}
                                        </div>
                                        <div
                                            className={`rounded-lg px-3 py-2 text-sm ${
                                                isMe
                                                    ? "bg-blue-500/10 text-foreground"
                                                    : "bg-muted"
                                            }`}
                                        >
                                            {renderMessageWithMentions(
                                                msg.message
                                            )}
                                        </div>
                                        <div
                                            className={`text-[10px] mt-1 ${
                                                isMe
                                                    ? "text-right"
                                                    : "text-left"
                                            } text-muted-foreground`}
                                        >
                                            {formatTime(msg.created_at)}
                                            {msg.pending && (
                                                <span className="ml-1">
                                                    sending...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="p-3 border-t flex-shrink-0">
                <div className="relative">
                    <Input
                        ref={inputRef}
                        placeholder="Type @ to mention someone..."
                        value={inputMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                        className="flex-1 h-9 text-sm shadow-none"
                    />
                    {showMentions && mentionSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border rounded-md shadow-lg z-50">
                            <ScrollArea className="h-auto max-h-[120px]">
                                <div className="p-1">
                                    {mentionSuggestions.map(
                                        (suggestion, idx) => (
                                            <button
                                                key={suggestion.id}
                                                onClick={() =>
                                                    insertMention(suggestion)
                                                }
                                                className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                                                    idx === mentionIndex
                                                        ? "bg-primary text-primary-foreground"
                                                        : "hover:bg-muted"
                                                }`}
                                            >
                                                {suggestion.name}
                                            </button>
                                        )
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 mt-2 justify-end">
                    <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={!inputMessage.trim() || sending}
                    >
                        Send
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
