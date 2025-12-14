"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    ArrowRightLeft,
    Loader2,
} from "lucide-react";
import { AccountSettingsDialog } from "./account-settings-dialog";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserOnlineStatus } from "@/hooks/use-user-online-status";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useNurseShift } from "@/hooks/use-nurse-shift";
import { createClient } from "@/lib/supabase/client";

export function TopRightPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const { user } = useAuthUser();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    const userEmail = user?.email || "";
    const userId = user?.id || "";

    const { profile } = useUserProfile(userId);
    const { shift, loading: shiftLoading } = useNurseShift(userId);

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

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
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
            router.push("/");
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
                        <CollapsibleContent className="mt-2 space-y-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2 shadow-none"
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
                                className="w-full justify-start gap-2 shadow-none"
                                disabled
                            >
                                <Clock className="h-4 w-4" />
                                Clock Out
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2 shadow-none"
                                disabled
                            >
                                <ArrowRightLeft className="h-4 w-4" />
                                Switch User
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2 bg-destructive/20 shadow-none"
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                            >
                                <LogOut className="h-4 w-4" />
                                {isSigningOut ? "Signing out..." : "Sign Out"}
                            </Button>
                        </CollapsibleContent>
                    </Collapsible>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-3 border-t border-forground-muted">
                    {shiftLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : !shift ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                            No shift assigned
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Role */}
                            <div className="text-sm">
                                <span className="text-muted-foreground">
                                    Role:{" "}
                                </span>
                                <span className="font-medium">
                                    {shift.role}
                                </span>
                            </div>

                            {/* Shift Time */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                    Shift: {formatTime(shift.shift_start)} -{" "}
                                    {formatTime(shift.shift_end)}
                                </span>
                            </div>

                            {/* General Duties */}
                            {shift.duties.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">
                                        General Duties
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {shift.duties.map((duty) => (
                                            <li
                                                key={duty.id}
                                                className="flex items-start gap-2 text-sm"
                                            >
                                                <span className="text-muted-foreground">
                                                    •
                                                </span>
                                                <span>{duty.duty}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AccountSettingsDialog
                open={settingsDialogOpen}
                onOpenChange={setSettingsDialogOpen}
                userName={displayName}
                userEmail={userEmail}
                userId={userId}
            />
        </>
    );
}
