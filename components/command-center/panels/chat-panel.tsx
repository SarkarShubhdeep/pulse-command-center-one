"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

    const handleSend = async () => {
        if (!inputMessage.trim() || sending) return;
        const msg = inputMessage;
        setInputMessage("");
        await sendMessage(msg, userId, userName, []);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
                                            {msg.message}
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
                        placeholder="Type a message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                        className="flex-1 h-9 text-sm shadow-none"
                    />
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
