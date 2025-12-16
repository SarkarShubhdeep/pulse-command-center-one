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
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    LogOut,
    Clock,
    Settings2,
    Moon,
    Sun,
    ArrowRightLeft,
    Loader2,
    UserPlus,
    DoorOpen,
    ChevronsUpDown,
    ChevronDown,
} from "lucide-react";
import { AccountSettingsDialog } from "./account-settings-dialog";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserOnlineStatus } from "@/hooks/use-user-online-status";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useNurseShift } from "@/hooks/use-nurse-shift";
import { createClient } from "@/lib/supabase/client";
import { useSessionManager } from "@/hooks/use-session-manager";

export function TopRightPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [showSwitchMenu, setShowSwitchMenu] = useState(false);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [switchPin, setSwitchPin] = useState("");
    const [switchError, setSwitchError] = useState("");
    const [dutiesOpen, setDutiesOpen] = useState(true);
    const { user } = useAuthUser();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { getOtherSessions, switchToUser, clearAllSessions } =
        useSessionManager();

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

            // Clear all stored sessions and sign out
            await clearAllSessions();
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
            setIsSigningOut(false);
        }
    };

    const handleQuickSwitch = async (
        targetUserId: string,
        targetEmail: string
    ) => {
        if (!switchPin) {
            setSwitchError("Please enter your PIN");
            return;
        }

        setIsSwitching(true);
        setSwitchError("");

        try {
            // Verify PIN first
            const response = await fetch("/api/auth/pin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: targetEmail, pin: switchPin }),
            });

            const data = await response.json();

            if (!response.ok) {
                setSwitchError(data.error || "Invalid PIN");
                setIsSwitching(false);
                return;
            }

            // PIN verified - proceed with switch
            const supabase = createClient();

            // Set current user offline
            if (userId) {
                await supabase
                    .from("users")
                    .update({ is_online: false })
                    .eq("id", userId);
            }

            // Switch to the target user's session
            await switchToUser(targetUserId);

            // Set new user online
            await supabase
                .from("users")
                .update({ is_online: true })
                .eq("id", targetUserId);

            // Reset state and close menu
            setShowSwitchMenu(false);
            setExpandedUserId(null);
            setSwitchPin("");

            // Refresh the page to load new user data
            router.refresh();
        } catch (error) {
            console.error("Error switching user:", error);
            setSwitchError("An error occurred");
        } finally {
            setIsSwitching(false);
        }
    };

    const otherSessions = getOtherSessions();

    // Exit session - just go to landing page without signing out
    const handleExitSession = async () => {
        const supabase = createClient();

        // Set current user offline but keep session stored
        if (userId) {
            await supabase
                .from("users")
                .update({ is_online: false })
                .eq("id", userId);
        }

        // Navigate to landing page with exit_session flag to prevent redirect back
        router.push("/?exit_session=true");
    };

    return (
        <>
            <Card className="w-72 h-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardHeader className="py-2 px-2">
                    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                        <CollapsibleTrigger asChild>
                            <CardTitle className="font-medium flex items-center justify-between hover:bg-accent hover:text-accent-foreground p-2 rounded-md cursor-pointer">
                                <span className="truncate">
                                    {displayName}
                                    <ChevronsUpDown className="ml-2 h-4 shrink-0 inline" />
                                </span>
                                <Avatar className="border h-10 w-10">
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
                            <Popover
                                open={showSwitchMenu}
                                onOpenChange={setShowSwitchMenu}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full justify-start gap-2 shadow-none"
                                        disabled={isSwitching}
                                    >
                                        {isSwitching ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowRightLeft className="h-4 w-4" />
                                        )}
                                        {isSwitching
                                            ? "Switching..."
                                            : "Quick switch user"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    side="left"
                                    align="start"
                                    className="w-64 p-2 mr-2"
                                >
                                    <div className="space-y-1">
                                        {otherSessions.length > 0 ? (
                                            <>
                                                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                                                    Switch to account
                                                </p>
                                                {otherSessions.map(
                                                    (session) => (
                                                        <Collapsible
                                                            key={session.userId}
                                                            open={
                                                                expandedUserId ===
                                                                session.userId
                                                            }
                                                            onOpenChange={(
                                                                open
                                                            ) => {
                                                                setExpandedUserId(
                                                                    open
                                                                        ? session.userId
                                                                        : null
                                                                );
                                                                setSwitchPin(
                                                                    ""
                                                                );
                                                                setSwitchError(
                                                                    ""
                                                                );
                                                            }}
                                                        >
                                                            <CollapsibleTrigger
                                                                asChild
                                                            >
                                                                <button className="w-full px-2 py-2 text-left text-sm hover:bg-accent rounded-md flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarFallback className="text-xs">
                                                                            {getInitials(
                                                                                session.fullName
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium truncate">
                                                                            {
                                                                                session.fullName
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground truncate">
                                                                            {
                                                                                session.email
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent className="px-2 pb-2">
                                                                <form
                                                                    onSubmit={(
                                                                        e
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        handleQuickSwitch(
                                                                            session.userId,
                                                                            session.email
                                                                        );
                                                                    }}
                                                                    className="flex gap-2 mt-2"
                                                                >
                                                                    <Input
                                                                        type="password"
                                                                        placeholder="Enter PIN"
                                                                        value={
                                                                            switchPin
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setSwitchPin(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="h-8 text-sm"
                                                                        autoFocus
                                                                        maxLength={
                                                                            6
                                                                        }
                                                                        disabled={
                                                                            isSwitching
                                                                        }
                                                                    />
                                                                    <button
                                                                        type="submit"
                                                                        disabled={
                                                                            !switchPin ||
                                                                            isSwitching
                                                                        }
                                                                        className="h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                                    >
                                                                        {isSwitching ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <ArrowRightLeft className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                </form>
                                                                {switchError && (
                                                                    <p className="text-xs text-destructive mt-1">
                                                                        {
                                                                            switchError
                                                                        }
                                                                    </p>
                                                                )}
                                                            </CollapsibleContent>
                                                        </Collapsible>
                                                    )
                                                )}
                                                <div className="border-t my-1" />
                                            </>
                                        ) : (
                                            <p className="text-xs text-muted-foreground px-2 py-1">
                                                No other accounts signed in
                                            </p>
                                        )}
                                        <button
                                            className="w-full px-2 py-2 text-left text-sm hover:bg-accent rounded-md flex items-center gap-3"
                                            onClick={() => {
                                                setShowSwitchMenu(false);
                                                handleExitSession();
                                            }}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                <UserPlus className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">
                                                Sign in as another user
                                            </span>
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2 shadow-none"
                                onClick={handleExitSession}
                            >
                                <DoorOpen className="h-4 w-4" />
                                Exit Session
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
                                <Collapsible
                                    open={dutiesOpen}
                                    onOpenChange={setDutiesOpen}
                                >
                                    <CollapsibleTrigger asChild>
                                        <button className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                            <span>General Duties</span>
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform ${
                                                    dutiesOpen
                                                        ? "transform rotate-180"
                                                        : ""
                                                }`}
                                            />
                                        </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-2">
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
                                    </CollapsibleContent>
                                </Collapsible>
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
