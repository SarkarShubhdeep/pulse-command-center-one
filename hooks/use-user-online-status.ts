"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUserOnlineStatus(userId: string) {
    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();

        const markUserOnline = async () => {
            try {
                await supabase
                    .from("users")
                    .update({ is_online: true })
                    .eq("id", userId);
            } catch (error) {
                console.error("Error marking user online:", error);
            }
        };

        const markUserOffline = async () => {
            try {
                await supabase
                    .from("users")
                    .update({ is_online: false })
                    .eq("id", userId);
            } catch (error) {
                console.error("Error marking user offline:", error);
            }
        };

        markUserOnline();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                markUserOffline();
            } else {
                markUserOnline();
            }
        };

        const handleBeforeUnload = () => {
            markUserOffline();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            window.removeEventListener("beforeunload", handleBeforeUnload);
            markUserOffline();
        };
    }, [userId]);
}
