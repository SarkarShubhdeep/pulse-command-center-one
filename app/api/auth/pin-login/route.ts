import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { email, pin } = await request.json();

        if (!email || !pin) {
            return NextResponse.json(
                { error: "Email and PIN are required" },
                { status: 400 }
            );
        }

        const adminClient = createAdminClient();

        // Verify PIN against the users table (using quick_switch_pin column)
        const { data: user, error: userError } = await adminClient
            .from("users")
            .select("id, email, quick_switch_pin")
            .eq("email", email)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (!user.quick_switch_pin) {
            return NextResponse.json(
                { error: "PIN not set for this user" },
                { status: 400 }
            );
        }

        // Compare hashed PIN
        const isValidPin = await bcrypt.compare(pin, user.quick_switch_pin);
        if (!isValidPin) {
            return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
        }

        // Generate a magic link for the user
        const { data: linkData, error: linkError } =
            await adminClient.auth.admin.generateLink({
                type: "magiclink",
                email: email,
            });

        if (linkError || !linkData) {
            console.error("Error generating auth link:", linkError);
            return NextResponse.json(
                { error: "Failed to authenticate" },
                { status: 500 }
            );
        }

        // Get the hashed token from the link properties
        const tokenHash = linkData.properties?.hashed_token;
        if (!tokenHash) {
            return NextResponse.json(
                { error: "Failed to generate authentication token" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            token_hash: tokenHash,
            email: email,
        });
    } catch (err) {
        console.error("Error in PIN login:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
