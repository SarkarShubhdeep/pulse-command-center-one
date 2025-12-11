"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    LogOut,
    Clock,
    Settings2,
    Moon,
    Sun,
    MessageCircle,
} from "lucide-react";
import { AccountSettingsDialog } from "./account-settings-dialog";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserOnlineStatus } from "@/hooks/use-user-online-status";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useChat } from "@/hooks/use-chat";
import { UsersList } from "./users-list";
import { ChatPanel } from "./chat-panel";
import { createClient } from "@/lib/supabase/client";

export function TopRightPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { user } = useAuthUser();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    const userEmail = user?.email || "";
    const userId = user?.id || "";

    const { profile } = useUserProfile(userId);
    const { unreadCount, hasMentions } = useChat(userId);

    useUserOnlineStatus(userId);
    const displayName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "User";

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            const supabase = createClient();

            if (userId) {
                await supabase
                    .from("users")
                    .update({ is_online: false })
                    .eq("id", userId);
            }

            await supabase.auth.signOut();
            router.push("/auth/login");
        } catch (error) {
            console.error("Error signing out:", error);
            setIsSigningOut(false);
        }
    };

    return (
        <>
            <Card className="w-72 h-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardHeader className="py-2 px-2">
                    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                        <CollapsibleTrigger asChild>
                            <CardTitle className="font-medium flex items-center justify-between hover:bg-accent hover:text-accent-foreground p-2 rounded-md cursor-pointer">
                                <span>{displayName}</span>
                                <Avatar className="border">
                                    <AvatarImage src="" />
                                    <AvatarFallback>
                                        {getInitials(displayName)}
                                    </AvatarFallback>
                                </Avatar>
                            </CardTitle>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => setSettingsDialogOpen(true)}
                            >
                                <Settings2 className="h-4 w-4" />
                                Account Settings
                            </Button>
                            <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2">
                                    {theme === "dark" ? (
                                        <Moon className="h-4 w-4" />
                                    ) : (
                                        <Sun className="h-4 w-4" />
                                    )}
                                    <Label
                                        htmlFor="theme-toggle"
                                        style={{ fontSize: 12 }}
                                    >
                                        Dark Mode
                                    </Label>
                                </div>
                                <Switch
                                    id="theme-toggle"
                                    checked={theme === "dark"}
                                    onCheckedChange={(checked) =>
                                        setTheme(checked ? "dark" : "light")
                                    }
                                />
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2"
                                disabled
                            >
                                <Clock className="h-4 w-4" />
                                Clock Out
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2 bg-destructive/20"
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                            >
                                <LogOut className="h-4 w-4" />
                                {isSigningOut ? "Signing out..." : "Sign Out"}
                            </Button>
                        </CollapsibleContent>
                    </Collapsible>
                </CardHeader>
                <CardContent className="px-2 pb-4 pt-3 border-t border-forground-muted">
                    <UsersList currentUserId={userId} />
                </CardContent>
            </Card>

            <AccountSettingsDialog
                open={settingsDialogOpen}
                onOpenChange={setSettingsDialogOpen}
                userName={displayName}
                userEmail={userEmail}
                userId={userId}
            />

            {!isChatOpen && (
                <div className="absolute right-full mr-4 top-0 flex items-center gap-2">
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
                        size="sm"
                        className="rounded-full h-9 w-9 p-0"
                        onClick={() => setIsChatOpen(true)}
                    >
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {isChatOpen && (
                <div className="absolute right-full mr-4 top-0">
                    <ChatPanel
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                        userId={userId}
                        userName={displayName}
                    />
                </div>
            )}
        </>
    );
}
