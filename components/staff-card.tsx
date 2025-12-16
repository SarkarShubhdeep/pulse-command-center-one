"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
import { Label } from "./ui/label";
import { createClient } from "@/lib/supabase/client";

interface StaffCardProps {
    name: string;
    role: string;
    email?: string;
    disabled?: boolean;
}

interface StoredSession {
    userId: string;
    email: string;
    fullName: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

const SESSIONS_KEY = "synapse_stored_sessions";
const ACTIVE_USER_KEY = "synapse_active_user";

export function StaffCard({
    name,
    role,
    email,
    disabled = false,
}: StaffCardProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasSession, setHasSession] = useState(false);
    const [storedSession, setStoredSession] = useState<StoredSession | null>(
        null
    );
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Check if this user has a stored session
    useEffect(() => {
        if (!email) return;
        try {
            const sessionsJson = localStorage.getItem(SESSIONS_KEY);
            if (sessionsJson) {
                const sessions = JSON.parse(sessionsJson) as StoredSession[];
                const userSession = sessions.find(
                    (s) => s.email === email && s.expiresAt > Date.now()
                );
                setHasSession(!!userSession);
                setStoredSession(userSession || null);
            }
        } catch {
            setHasSession(false);
            setStoredSession(null);
        }
    }, [email]);

    const handleClick = () => {
        if (disabled) return;
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({ top: rect.top, left: rect.left });
        }
        setIsExpanded(true);
        // Show error immediately if no session
        if (!hasSession) {
            setError(
                "Please sign into your account using master password first."
            );
        }
    };

    const handleClose = () => {
        setIsExpanded(false);
        setPin("");
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin || !email) return;

        // Check if user has an active session
        if (!hasSession || !storedSession) {
            setError(
                "Please sign into your account using master password first."
            );
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Verify PIN with the backend
            const response = await fetch("/api/auth/pin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, pin }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Invalid PIN");
                setIsLoading(false);
                return;
            }

            // PIN is valid - restore the stored session
            const supabase = createClient();
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: storedSession.accessToken,
                refresh_token: storedSession.refreshToken,
            });

            if (sessionError) {
                setError("Session expired. Please sign in again.");
                setIsLoading(false);
                return;
            }

            // Update active user in localStorage
            localStorage.setItem(ACTIVE_USER_KEY, storedSession.userId);

            // Set user online
            await supabase
                .from("users")
                .update({ is_online: true })
                .eq("id", storedSession.userId);

            // Redirect to command center
            router.push("/command-center");
        } catch (err) {
            console.error("PIN login error:", err);
            setError("An error occurred");
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                disabled={disabled}
                className={`text-left ring-[0.5px] ring-transparent ring-offset-4 transition-all duration-150 p-2 flex flex-col ${
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : // : "hover:ring-blue-300 hover:ring-offset-1 cursor-pointer"
                          "hover:bg-accent  duration-150 cursor-pointer"
                }`}
                onClick={handleClick}
            >
                <div
                    className={`w-16 h-16 aspect-square rounded-lg mb-2 ${
                        disabled ? "bg-gray-300" : "bg-gray-200"
                    }`}
                />
                <p
                    className={`text-sm font-medium ${
                        disabled ? "text-gray-400" : "text-gray-900"
                    }`}
                >
                    {name}
                </p>
                <p
                    className={`text-xs ${
                        disabled ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                    {role}
                </p>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-40"
                            onClick={handleClose}
                        />

                        {/* Expanded Card */}
                        <motion.div
                            initial={{
                                opacity: 0,

                                top: `${position.top}px`,
                                left: `${position.left - 20}px`,
                            }}
                            animate={{
                                opacity: 1,
                                top: position.top,
                                left: position.left,
                            }}
                            exit={{
                                opacity: 0,
                                left: `${position.left + 20}px`,
                            }}
                            transition={{
                                type: "spring",
                                bounce: 0.2,
                                duration: 0.3,
                            }}
                            className="fixed z-50 bg-zinc-900 rounded-xl shadow-2xl p-4 w-64"
                            style={{ top: position.top, left: position.left }}
                        >
                            {/* Avatar, Name, Role */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-16 h-16 aspect-square bg-zinc-700 rounded-lg flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">
                                        {name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {role}
                                    </p>
                                </div>
                            </div>

                            <Label className="text-xs mt-6 text-muted-foreground mb-2 block">
                                Quickly login using your PIN
                            </Label>
                            {/* PIN Input */}
                            <form
                                onSubmit={handleSubmit}
                                className="flex gap-2"
                            >
                                <Input
                                    type="password"
                                    placeholder="Quick PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="h-10 text-sm bg-zinc-800 border-none text-white placeholder:text-zinc-400"
                                    autoFocus
                                    maxLength={6}
                                    disabled={!hasSession || isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!pin || !hasSession || isLoading}
                                    className="h-10 w-10 flex items-center justify-center bg-background rounded-md hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4" />
                                    )}
                                </button>
                            </form>
                            {error && (
                                <p className="text-xs text-red-400 mt-2">
                                    {error}
                                </p>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
