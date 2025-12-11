"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UserItem {
    id: string;
    email: string;
    full_name: string;
    is_online: boolean;
}

interface UsersList {
    online: UserItem[];
    offline: UserItem[];
    loading: boolean;
    error: Error | null;
}

export function useUsersList(): UsersList {
    const [online, setOnline] = useState<UserItem[]>([]);
    const [offline, setOffline] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const fetchUsers = async () => {
            try {
                const { data, error: err } = await supabase
                    .from("users")
                    .select("id, email, full_name, is_online")
                    .order("is_online", { ascending: false })
                    .order("full_name", { ascending: true });

                if (err) {
                    setError(err);
                    setOnline([]);
                    setOffline([]);
                } else {
                    const users = (data || []) as UserItem[];
                    setOnline(users.filter((u) => u.is_online));
                    setOffline(users.filter((u) => !u.is_online));
                    setError(null);
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err : new Error("Unknown error")
                );
                setOnline([]);
                setOffline([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();

        const subscription = supabase
            .channel("users")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "users" },
                () => {
                    fetchUsers();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { online, offline, loading, error };
}
