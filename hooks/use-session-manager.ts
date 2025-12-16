"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";

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

export function useSessionManager() {
    const [storedSessions, setStoredSessions] = useState<StoredSession[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load stored sessions from localStorage
    useEffect(() => {
        const loadSessions = () => {
            try {
                const sessionsJson = localStorage.getItem(SESSIONS_KEY);
                const activeUser = localStorage.getItem(ACTIVE_USER_KEY);

                if (sessionsJson) {
                    const sessions = JSON.parse(
                        sessionsJson
                    ) as StoredSession[];
                    // Filter out expired sessions
                    const validSessions = sessions.filter(
                        (s) => s.expiresAt > Date.now()
                    );
                    setStoredSessions(validSessions);

                    // Update localStorage if we removed expired sessions
                    if (validSessions.length !== sessions.length) {
                        localStorage.setItem(
                            SESSIONS_KEY,
                            JSON.stringify(validSessions)
                        );
                    }
                }

                if (activeUser) {
                    setActiveUserId(activeUser);
                }
            } catch (error) {
                console.error("Error loading sessions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSessions();
    }, []);

    // Store a new session after login
    const storeSession = useCallback(
        async (session: Session, userInfo: { fullName: string }) => {
            if (
                !session.user?.id ||
                !session.access_token ||
                !session.refresh_token
            ) {
                return;
            }

            const newSession: StoredSession = {
                userId: session.user.id,
                email: session.user.email || "",
                fullName: userInfo.fullName,
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                expiresAt: session.expires_at
                    ? session.expires_at * 1000
                    : Date.now() + 3600000,
            };

            setStoredSessions((prev) => {
                // Remove existing session for this user if exists
                const filtered = prev.filter(
                    (s) => s.userId !== newSession.userId
                );
                const updated = [...filtered, newSession];
                localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
                return updated;
            });

            // Set as active user
            setActiveUserId(newSession.userId);
            localStorage.setItem(ACTIVE_USER_KEY, newSession.userId);
        },
        []
    );

    // Switch to a different stored session
    const switchToUser = useCallback(
        async (userId: string) => {
            const session = storedSessions.find((s) => s.userId === userId);
            if (!session) {
                throw new Error("Session not found");
            }

            // Check if session is expired
            if (session.expiresAt < Date.now()) {
                // Remove expired session
                setStoredSessions((prev) => {
                    const updated = prev.filter((s) => s.userId !== userId);
                    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
                    return updated;
                });
                throw new Error("Session expired");
            }

            const supabase = createClient();

            // Set the session in Supabase
            const { error } = await supabase.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
            });

            if (error) {
                // If session is invalid, remove it
                setStoredSessions((prev) => {
                    const updated = prev.filter((s) => s.userId !== userId);
                    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
                    return updated;
                });
                throw error;
            }

            // Update active user
            setActiveUserId(userId);
            localStorage.setItem(ACTIVE_USER_KEY, userId);

            return session;
        },
        [storedSessions]
    );

    // Remove a specific session
    const removeSession = useCallback(
        (userId: string) => {
            setStoredSessions((prev) => {
                const updated = prev.filter((s) => s.userId !== userId);
                localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
                return updated;
            });

            if (activeUserId === userId) {
                setActiveUserId(null);
                localStorage.removeItem(ACTIVE_USER_KEY);
            }
        },
        [activeUserId]
    );

    // Clear all sessions (for logout)
    const clearAllSessions = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();

        setStoredSessions([]);
        setActiveUserId(null);
        localStorage.removeItem(SESSIONS_KEY);
        localStorage.removeItem(ACTIVE_USER_KEY);

        // Clear any other app-specific localStorage items
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("synapse_") || key?.startsWith("sb-")) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    }, []);

    // Get other available sessions (not the current active one)
    const getOtherSessions = useCallback(() => {
        return storedSessions.filter((s) => s.userId !== activeUserId);
    }, [storedSessions, activeUserId]);

    // Check if quick switch is available
    const canQuickSwitch = storedSessions.length > 1;

    return {
        storedSessions,
        activeUserId,
        isLoading,
        storeSession,
        switchToUser,
        removeSession,
        clearAllSessions,
        getOtherSessions,
        canQuickSwitch,
    };
}
