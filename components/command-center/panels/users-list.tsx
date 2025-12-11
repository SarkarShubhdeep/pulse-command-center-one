"use client";

import { useUsersList } from "@/hooks/use-users-list";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface UsersListProps {
    currentUserId?: string;
}

export function UsersList({ currentUserId }: UsersListProps) {
    const { online, offline, loading, error } = useUsersList();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-xs text-destructive py-2">
                Failed to load users
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <div className="space-y-3">
            {online.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Online ({online.length})
                    </div>
                    <div className="space-y-1">
                        {online.map((user) => (
                            <Button
                                key={user.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 h-auto py-2"
                            >
                                <div className="relative">
                                    <Avatar className="">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="text-xs">
                                            {getInitials(user.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-background" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {currentUserId === user.id
                                            ? "Me"
                                            : user.full_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {offline.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Offline ({offline.length})
                    </div>
                    <div className="space-y-1">
                        {offline.map((user) => (
                            <Button
                                key={user.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 h-auto py-2 opacity-60"
                            >
                                <div className="relative">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="text-xs">
                                            {getInitials(user.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 h-2 w-2 bg-gray-400 rounded-full border border-background" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {currentUserId === user.id
                                            ? "Me"
                                            : user.full_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {online.length === 0 && offline.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                    No users found
                </div>
            )}
        </div>
    );
}
