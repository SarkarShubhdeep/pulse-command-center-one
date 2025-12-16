"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TaskCategory, DEFAULT_TASK_CATEGORIES } from "@/lib/types/tasks";

interface UseTaskCategoriesResult {
    categories: TaskCategory[];
    loading: boolean;
    error: Error | null;
    seedCategories: () => Promise<void>;
    refetch: () => Promise<void>;
}

export function useTaskCategories(): UseTaskCategoriesResult {
    const [categories, setCategories] = useState<TaskCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCategories = useCallback(async () => {
        const supabase = createClient();

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from("task_categories")
                .select("*")
                .order("name");

            if (fetchError) {
                setError(fetchError);
                return;
            }

            setCategories(data || []);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err
                    : new Error("Failed to fetch categories")
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const seedCategories = useCallback(async () => {
        const supabase = createClient();

        try {
            setLoading(true);

            // Check if categories already exist
            const { data: existing, error: checkError } = await supabase
                .from("task_categories")
                .select("name");

            if (checkError) {
                setError(checkError);
                return;
            }

            const existingNames = new Set(existing?.map((c) => c.name) || []);

            // Filter out categories that already exist
            const categoriesToInsert = DEFAULT_TASK_CATEGORIES.filter(
                (cat) => !existingNames.has(cat.name)
            );

            if (categoriesToInsert.length === 0) {
                console.log("All categories already exist");
                await fetchCategories();
                return;
            }

            // Insert missing categories
            const { error: insertError } = await supabase
                .from("task_categories")
                .insert(categoriesToInsert);

            if (insertError) {
                setError(insertError);
                return;
            }

            console.log(`Seeded ${categoriesToInsert.length} categories`);
            await fetchCategories();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err
                    : new Error("Failed to seed categories")
            );
        } finally {
            setLoading(false);
        }
    }, [fetchCategories]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        loading,
        error,
        seedCategories,
        refetch: fetchCategories,
    };
}
