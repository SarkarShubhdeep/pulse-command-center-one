import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("users")
            .select("id, email, full_name, role")
            .limit(12);

        if (error) {
            console.error("Error fetching users:", error);
            return NextResponse.json({ users: [] }, { status: 200 });
        }

        return NextResponse.json({ users: data || [] }, { status: 200 });
    } catch (err) {
        console.error("Error in active users API:", err);
        return NextResponse.json({ users: [] }, { status: 200 });
    }
}
