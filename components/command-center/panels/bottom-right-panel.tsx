"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useChat } from "@/hooks/use-chat";
import { UsersList } from "./users-list";
import { ChatPanel } from "./chat-panel";

export function BottomRightPanel() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { user } = useAuthUser();
    const userId = user?.id;
    const { profile } = useUserProfile(userId);
    const { unreadCount, hasMentions } = useChat(userId || "");

    const displayName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "User";

    return (
        <div className="relative">
            <Card className="w-72 h-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All staffs and users
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <UsersList currentUserId={userId} />
                </CardContent>
            </Card>

            {/* Chat Button */}
            {!isChatOpen && (
                <div className="absolute right-full mr-4 bottom-0 flex items-center gap-2">
                    {hasMentions && (
                        <Badge
                            variant="destructive"
                            className="h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            @
                        </Badge>
                    )}
                    {unreadCount > 0 && !hasMentions && (
                        <Badge
                            variant="default"
                            className="h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full p-0 bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                        onClick={() => setIsChatOpen(true)}
                    >
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Chat Panel */}
            {isChatOpen && userId && (
                <div className="absolute right-full mr-4 bottom-0">
                    <ChatPanel
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                        userId={userId}
                        userName={displayName}
                    />
                </div>
            )}
        </div>
    );
}
