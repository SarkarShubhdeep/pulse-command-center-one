"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    is_online: boolean;
    role: string;
}

interface UseUserProfileReturn {
    profile: UserProfile | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useUserProfile(userId: string): UseUserProfileReturn {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProfile = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error: err } = await supabase
                .from("users")
                .select("id, email, full_name, is_online, role")
                .eq("id", userId)
                .single();

            if (err) {
                setError(err);
                setProfile(null);
            } else {
                setProfile(data);
                setError(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Unknown error"));
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initProfile = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const supabase = createClient();
                const { data, error: err } = await supabase
                    .from("users")
                    .select("id, email, full_name, is_online, role")
                    .eq("id", userId)
                    .single();

                if (err) {
                    setError(err);
                    setProfile(null);
                } else {
                    setProfile(data);
                    setError(null);
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err : new Error("Unknown error")
                );
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        initProfile();

        const supabase = createClient();
        const subscription = supabase
            .channel(`user-profile-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "users",
                    filter: `id=eq.${userId}`,
                },
                () => {
                    initProfile();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    return { profile, loading, error, refetch: fetchProfile };
}
