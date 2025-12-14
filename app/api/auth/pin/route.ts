import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Check if user has quick switch enabled
export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from("users")
            .select("quick_switch_enabled")
            .eq("id", user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            quickSwitchEnabled: data?.quick_switch_enabled ?? false,
        });
    } catch (error) {
        console.error("Get PIN status error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// POST - Set or update PIN
export async function POST(request: Request) {
    try {
        const { pin } = await request.json();

        if (!pin) {
            return NextResponse.json(
                { error: "PIN is required" },
                { status: 400 }
            );
        }

        // Validate PIN format (4-6 digits)
        if (!/^\d{4,6}$/.test(pin)) {
            return NextResponse.json(
                { error: "PIN must be 4-6 digits" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Hash the PIN using the database function
        const { data: hashedPin, error: hashError } = await supabase.rpc(
            "hash_pin",
            { pin }
        );

        if (hashError) {
            // If hash_pin function doesn't exist, store plain (not recommended for production)
            // This allows the feature to work before the SQL migration is run
            console.warn(
                "hash_pin function not found, storing PIN directly (run QUICK_SWITCH_SETUP.md migrations)"
            );

            const { error: updateError } = await supabase
                .from("users")
                .update({
                    quick_switch_enabled: true,
                    quick_switch_pin: pin,
                })
                .eq("id", user.id);

            if (updateError) {
                return NextResponse.json(
                    { error: updateError.message },
                    { status: 400 }
                );
            }
        } else {
            const { error: updateError } = await supabase
                .from("users")
                .update({
                    quick_switch_enabled: true,
                    quick_switch_pin: hashedPin,
                })
                .eq("id", user.id);

            if (updateError) {
                return NextResponse.json(
                    { error: updateError.message },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Set PIN error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// DELETE - Disable quick switch and remove PIN
export async function DELETE() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const { error: updateError } = await supabase
            .from("users")
            .update({
                quick_switch_enabled: false,
                quick_switch_pin: null,
            })
            .eq("id", user.id);

        if (updateError) {
            return NextResponse.json(
                { error: updateError.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete PIN error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
