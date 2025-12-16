"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StaffCard } from "@/components/staff-card";
import { useSessionManager } from "@/hooks/use-session-manager";

const sampleStaff = [
    // { name: "Mark Hoffner", role: "ICU/Trauma Nurse" },
    // { name: "Cindy Maxwell", role: "Surgical Nurse" },
    { name: "James Parker", role: "Pediatric Nurse" },
    { name: "Laura Bennett", role: "Emergency Room Nurse" },
    { name: "Sophia Kim", role: "Critical Care Nurse" },
    { name: "David Smith", role: "Medical-Surgical Nurse" },
    { name: "Emma Johnson", role: "Oncology Nurse" },
    { name: "Olivia Garcia", role: "Home Health Nurse" },
    { name: "Aiden Thompson", role: "Geriatric Nurse" },
];

interface StaffMember {
    name: string;
    role: string;
    email?: string;
    isReal?: boolean;
}

export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isAddingAccount = searchParams.get("add_account") === "true";
    const isExitingSession = searchParams.get("exit_session") === "true";
    const { user, loading } = useAuthUser();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");
    const [activeStaff, setActiveStaff] = useState<StaffMember[]>([]);
    const { storeSession } = useSessionManager();

    useEffect(() => {
        // Don't redirect if user is adding another account or exiting session
        if (!loading && user && !isAddingAccount && !isExitingSession) {
            router.push("/command-center");
        }
    }, [user, loading, router, isAddingAccount, isExitingSession]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("/api/users/active");
                const { users } = await response.json();

                if (users && users.length > 0) {
                    const fetchedUsers = users.map(
                        (user: {
                            id: string;
                            email: string;
                            full_name: string | null;
                            role: string | null;
                        }) => ({
                            name:
                                user.full_name ||
                                user.email?.split("@")[0] ||
                                "Unknown",
                            role: user.role || "Staff",
                            email: user.email,
                            isReal: true,
                        })
                    );

                    const remaining = 12 - fetchedUsers.length;
                    const sampleToAdd = sampleStaff
                        .slice(0, remaining)
                        .map((staff) => ({
                            ...staff,
                            isReal: false,
                        }));

                    setActiveStaff([...fetchedUsers, ...sampleToAdd]);
                } else {
                    setActiveStaff(
                        sampleStaff.map((staff) => ({
                            ...staff,
                            isReal: false,
                        }))
                    );
                }
            } catch (err) {
                console.error("Error fetching users:", err);
                setActiveStaff(
                    sampleStaff.map((staff) => ({ ...staff, isReal: false }))
                );
            }
        };

        fetchUsers();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
        });

        if (error) {
            setError(error.message);
            setIsLoggingIn(false);
        } else if (data.session) {
            // Fetch user's full name from the users table
            const { data: userData } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", data.session.user.id)
                .single();

            // Store the session for quick switching
            await storeSession(data.session, {
                fullName: userData?.full_name || username.split("@")[0],
            });

            router.push("/command-center");
            setPassword("");
            setUsername("");
            setIsLoggingIn(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Only return null if user exists and we're NOT exiting session or adding account
    if (user && !isExitingSession && !isAddingAccount) {
        return null;
    }

    return (
        <div className="min-h-screen flex p-8">
            {/* Left Panel - White Background */}
            <div className="flex-1 bg-white flex justify-center">
                <div className="w-2/3 flex flex-col justify-center">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 mb-16">
                        <Image
                            src="/assets/synapse-logo.svg"
                            alt="Synapse Logo"
                            width={48}
                            height={48}
                        />
                        <div>
                            <Image
                                src="/assets/synapse-logo-type.svg"
                                alt="Synapse"
                                width={140}
                                height={24}
                            />
                            <p className="text-xs text-gray-400 mt-0.5">
                                alpha0.2
                            </p>
                        </div>
                    </div>

                    {/* Active Staff Section */}
                    <div className="w-full">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 ">
                                ACTIVE STAFF
                            </h2>
                        </div>

                        {/* Staff Grid */}
                        <div className="grid grid-cols-4 gap-8 mt-8">
                            {activeStaff.map((staff, index) => (
                                <StaffCard
                                    key={index}
                                    name={staff.name}
                                    role={staff.role}
                                    email={staff.email}
                                    disabled={!staff.isReal}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-8">
                            <span>Can&apos;t see your account?</span>
                            <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                <Search className="w-3 h-3" />
                                Search with cmd + k
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Dark Background */}
            <div className="bg-zinc-900 flex flex-col justify-center rounded-2xl px-8">
                <div className="w-[500px] mx-auto mb-4 flex items-center justify-center flex-col px-8">
                    <h2 className="text-xl font-medium text-white mb-8 w-full text-left">
                        LOG INTO YOUR ACCOUNT
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-4 w-full">
                        <Input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-zinc-800 border-none text-white placeholder:text-zinc-500 h-12"
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-zinc-800 border-none text-white placeholder:text-zinc-500 h-12"
                        />

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm text-muted-foreground group"
                                >
                                    Forgot password?{" "}
                                    <span className="text-blue-400 group-hover:text-blue-300">
                                        Contact Admin
                                    </span>
                                </Link>
                                <Link
                                    href="#"
                                    className="text-sm text-destructive hover:text-red-300"
                                >
                                    Contact Emergency
                                </Link>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoggingIn || !username || !password}
                                className="flex items-center gap-2 text-white font-medium hover:text-gray-300 disabled:opacity-50"
                            >
                                {isLoggingIn ? "SIGNING IN..." : "SIGN IN"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
