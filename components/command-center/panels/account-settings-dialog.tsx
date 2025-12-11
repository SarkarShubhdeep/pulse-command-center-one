"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface AccountSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userName: string;
    userEmail: string;
    userId?: string;
}

export function AccountSettingsDialog({
    open,
    onOpenChange,
    userName,
    userEmail,
    userId,
}: AccountSettingsDialogProps) {
    const [name, setName] = useState(userName || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !userId) return;

        setIsSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("users")
                .update({ full_name: name })
                .eq("id", userId);

            if (error) {
                console.error("Error updating profile:", error);
                return;
            }

            onOpenChange(false);
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setName(userName || "");
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Account Settings</DialogTitle>
                    <DialogDescription>
                        Update your basic account information
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={userEmail}
                            disabled
                            placeholder="Your email"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
