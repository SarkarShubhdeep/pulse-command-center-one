"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShiftTask, CreateTaskInput, UpdateTaskInput } from "@/lib/types/tasks";

interface UseShiftTasksResult {
    tasks: ShiftTask[];
    loading: boolean;
    error: Error | null;
    createTask: (input: CreateTaskInput) => Promise<ShiftTask | null>;
    updateTask: (
        id: string,
        input: UpdateTaskInput
    ) => Promise<ShiftTask | null>;
    deleteTask: (id: string) => Promise<boolean>;
    updateTaskPosition: (id: string, x: number, y: number) => Promise<boolean>;
    updateTaskStatus: (
        id: string,
        status: ShiftTask["status"]
    ) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useShiftTasks(
    shiftId: string | undefined
): UseShiftTasksResult {
    const [tasks, setTasks] = useState<ShiftTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTasks = useCallback(async () => {
        if (!shiftId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        const supabase = createClient();

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from("shift_tasks")
                .select("*")
                .eq("shift_id", shiftId)
                .order("scheduled_time");

            if (fetchError) {
                setError(fetchError);
                return;
            }

            setTasks(data || []);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err : new Error("Failed to fetch tasks")
            );
        } finally {
            setLoading(false);
        }
    }, [shiftId]);

    const createTask = useCallback(
        async (input: CreateTaskInput): Promise<ShiftTask | null> => {
            const supabase = createClient();

            try {
                const { data, error: createError } = await supabase
                    .from("shift_tasks")
                    .insert(input)
                    .select()
                    .single();

                if (createError) {
                    setError(createError);
                    return null;
                }

                setTasks((prev) => [...prev, data]);
                return data;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to create task")
                );
                return null;
            }
        },
        []
    );

    const updateTask = useCallback(
        async (
            id: string,
            input: UpdateTaskInput
        ): Promise<ShiftTask | null> => {
            const supabase = createClient();

            try {
                const { data, error: updateError } = await supabase
                    .from("shift_tasks")
                    .update({ ...input, updated_at: new Date().toISOString() })
                    .eq("id", id)
                    .select()
                    .single();

                if (updateError) {
                    setError(updateError);
                    return null;
                }

                setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
                return data;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to update task")
                );
                return null;
            }
        },
        []
    );

    const deleteTask = useCallback(async (id: string): Promise<boolean> => {
        const supabase = createClient();

        try {
            const { error: deleteError } = await supabase
                .from("shift_tasks")
                .delete()
                .eq("id", id);

            if (deleteError) {
                setError(deleteError);
                return false;
            }

            setTasks((prev) => prev.filter((t) => t.id !== id));
            return true;
        } catch (err) {
            setError(
                err instanceof Error ? err : new Error("Failed to delete task")
            );
            return false;
        }
    }, []);

    const updateTaskPosition = useCallback(
        async (id: string, x: number, y: number): Promise<boolean> => {
            const supabase = createClient();

            try {
                const { error: updateError } = await supabase
                    .from("shift_tasks")
                    .update({
                        position_x: x,
                        position_y: y,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", id);

                if (updateError) {
                    setError(updateError);
                    return false;
                }

                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === id ? { ...t, position_x: x, position_y: y } : t
                    )
                );
                return true;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to update task position")
                );
                return false;
            }
        },
        []
    );

    const updateTaskStatus = useCallback(
        async (id: string, status: ShiftTask["status"]): Promise<boolean> => {
            const supabase = createClient();

            try {
                const updateData: UpdateTaskInput = {
                    status,
                    completed_at:
                        status === "completed"
                            ? new Date().toISOString()
                            : null,
                };

                const { error: updateError } = await supabase
                    .from("shift_tasks")
                    .update({
                        ...updateData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", id);

                if (updateError) {
                    setError(updateError);
                    return false;
                }

                setTasks((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, ...updateData } : t))
                );
                return true;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to update task status")
                );
                return false;
            }
        },
        []
    );

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return {
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        updateTaskPosition,
        updateTaskStatus,
        refetch: fetchTasks,
    };
}
