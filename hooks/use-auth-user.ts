"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthUser {
    user: User | null;
    loading: boolean;
    error: Error | null;
}

export function useAuthUser(): AuthUser {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const getUser = async () => {
            try {
                const {
                    data: { user },
                    error: err,
                } = await supabase.auth.getUser();

                if (err) {
                    setError(err);
                    setUser(null);
                } else {
                    setUser(user);
                    setError(null);
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err : new Error("Unknown error")
                );
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    return { user, loading, error };
}
