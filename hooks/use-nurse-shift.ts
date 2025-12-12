"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface NurseDuty {
    id: string;
    duty: string;
}

export interface NurseShift {
    id: string;
    user_id: string;
    role: string;
    shift_start: string;
    shift_end: string;
    shift_date: string;
    duties: NurseDuty[];
}

interface UseNurseShiftResult {
    shift: NurseShift | null;
    loading: boolean;
    error: Error | null;
}

export function useNurseShift(userId: string | undefined): UseNurseShiftResult {
    const [shift, setShift] = useState<NurseShift | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const supabase = createClient();

        const fetchShiftAndDuties = async () => {
            try {
                setLoading(true);

                // Fetch the current shift for the user
                const { data: shiftData, error: shiftError } = await supabase
                    .from("nurse_shifts")
                    .select(
                        "id, user_id, role, shift_start, shift_end, shift_date"
                    )
                    .eq("user_id", userId)
                    .order("shift_date", { ascending: false })
                    .limit(1)
                    .single();

                if (shiftError) {
                    if (shiftError.code === "PGRST116") {
                        // No shift found
                        setShift(null);
                        setError(null);
                    } else {
                        setError(shiftError);
                        setShift(null);
                    }
                    setLoading(false);
                    return;
                }

                // Fetch duties for this shift
                const { data: dutiesData, error: dutiesError } = await supabase
                    .from("nurse_duties")
                    .select("id, duty")
                    .eq("shift_id", shiftData.id);

                if (dutiesError) {
                    setError(dutiesError);
                    setShift(null);
                    setLoading(false);
                    return;
                }

                setShift({
                    ...shiftData,
                    duties: dutiesData || [],
                });
                setError(null);
            } catch (err) {
                setError(
                    err instanceof Error ? err : new Error("Unknown error")
                );
                setShift(null);
            } finally {
                setLoading(false);
            }
        };

        fetchShiftAndDuties();
    }, [userId]);

    return { shift, loading, error };
}
