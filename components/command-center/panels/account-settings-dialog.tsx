"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";

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

    // Master password verification state
    const [masterPassword, setMasterPassword] = useState("");
    const [showMasterPassword, setShowMasterPassword] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // Password change state
    const [newPassword, setNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Quick switch PIN state
    const [quickSwitchEnabled, setQuickSwitchEnabled] = useState(false);
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [pinError, setPinError] = useState<string | null>(null);
    const [pinSuccess, setPinSuccess] = useState(false);
    const [isSavingPin, setIsSavingPin] = useState(false);
    const [isLoadingPinStatus, setIsLoadingPinStatus] = useState(true);

    useEffect(() => {
        if (open && userName) {
            setName(userName);
        }
    }, [open, userName]);

    // Fetch quick switch status when dialog opens
    useEffect(() => {
        if (open) {
            fetchQuickSwitchStatus();
        }
    }, [open]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setMasterPassword("");
            setShowMasterPassword(false);
            setIsVerified(false);
            setVerifyError(null);
            setNewPassword("");
            setShowNewPassword(false);
            setPasswordError(null);
            setPasswordSuccess(false);
            setPin("");
            setConfirmPin("");
            setPinError(null);
            setPinSuccess(false);
        }
    }, [open]);

    const fetchQuickSwitchStatus = async () => {
        setIsLoadingPinStatus(true);
        try {
            const response = await fetch("/api/auth/pin");
            if (response.ok) {
                const data = await response.json();
                setQuickSwitchEnabled(data.quickSwitchEnabled);
            }
        } catch (error) {
            console.error("Error fetching quick switch status:", error);
        } finally {
            setIsLoadingPinStatus(false);
        }
    };

    const handleVerifyPassword = async () => {
        setVerifyError(null);

        if (!masterPassword) {
            setVerifyError("Please enter your password");
            return;
        }

        setIsVerifying(true);
        try {
            const response = await fetch("/api/auth/verify-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: masterPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setVerifyError(data.error || "Incorrect password");
                return;
            }

            setIsVerified(true);
        } catch {
            setVerifyError("An unexpected error occurred");
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError(null);
        setPasswordSuccess(false);

        if (!newPassword) {
            setPasswordError("Please enter a new password");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters");
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: masterPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPasswordError(data.error || "Failed to change password");
                return;
            }

            setPasswordSuccess(true);
            setNewPassword("");
            // Update master password to the new one for subsequent operations
            setMasterPassword(newPassword);
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch {
            setPasswordError("An unexpected error occurred");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleQuickSwitchToggle = async (enabled: boolean) => {
        if (!enabled) {
            // Disable quick switch
            setIsSavingPin(true);
            try {
                const response = await fetch("/api/auth/pin", {
                    method: "DELETE",
                });

                if (response.ok) {
                    setQuickSwitchEnabled(false);
                    setPin("");
                    setConfirmPin("");
                    setPinError(null);
                }
            } catch (error) {
                console.error("Error disabling quick switch:", error);
            } finally {
                setIsSavingPin(false);
            }
        } else {
            // Just toggle the UI state - user needs to save PIN
            setQuickSwitchEnabled(true);
        }
    };

    const handleSavePin = async () => {
        setPinError(null);
        setPinSuccess(false);

        if (!pin || !confirmPin) {
            setPinError("Please enter and confirm your PIN");
            return;
        }

        if (!/^\d{4,6}$/.test(pin)) {
            setPinError("PIN must be 4-6 digits");
            return;
        }

        if (pin !== confirmPin) {
            setPinError("PINs do not match");
            return;
        }

        setIsSavingPin(true);
        try {
            const response = await fetch("/api/auth/pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPinError(data.error || "Failed to save PIN");
                return;
            }

            setQuickSwitchEnabled(true);
            setPinSuccess(true);
            setPin("");
            setConfirmPin("");
            setTimeout(() => setPinSuccess(false), 3000);
        } catch {
            setPinError("An unexpected error occurred");
        } finally {
            setIsSavingPin(false);
        }
    };

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
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Account Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account information and security settings
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Profile Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2 uppercase text-muted-foreground">
                            Profile Information
                        </h3>
                        <div className="grid gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Enter your name"
                                        className="flex-1 shadow-none"
                                    />
                                    <Button
                                        onClick={handleSave}
                                        disabled={
                                            isSaving ||
                                            !name.trim() ||
                                            name === userName
                                        }
                                        // size="sm"
                                    >
                                        {isSaving ? "Saving..." : "Update"}
                                    </Button>
                                </div>
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
                    </div>

                    <hr className="border-border" />

                    {/* Security Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2 uppercase text-muted-foreground">
                            <ShieldCheck className="h-4 w-4" />
                            Security
                        </h3>

                        {!isVerified ? (
                            /* Master Password Verification */
                            <div className="space-y-3 bg-muted/50 rounded-lg">
                                <div className="grid gap-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="masterPassword">
                                            Current Password
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enter your current password to
                                            change it and view quick switch
                                            settings
                                        </p>
                                        <div className="relative">
                                            <Input
                                                id="masterPassword"
                                                type={
                                                    showMasterPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={masterPassword}
                                                onChange={(e) =>
                                                    setMasterPassword(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter your password"
                                                className="pr-10 shadow-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleVerifyPassword();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowMasterPassword(
                                                        !showMasterPassword
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showMasterPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {verifyError && (
                                        <p className="text-sm text-destructive">
                                            {verifyError}
                                        </p>
                                    )}
                                    <Button
                                        onClick={handleVerifyPassword}
                                        disabled={
                                            isVerifying || !masterPassword
                                        }
                                        className="w-fit"
                                    >
                                        {isVerifying
                                            ? "Verifying..."
                                            : "Continue"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* Verified - Show Security Options */
                            <div className="space-y-6">
                                {/* Change Password Section */}
                                <div className="space-y-3 p-4 bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Lock className="h-4 w-4" />
                                        <h4 className="text-sm font-medium ">
                                            Change Password
                                        </h4>
                                    </div>
                                    <div className="flex flex-col gap-3 justify-end items-end">
                                        <div className="grid gap-2 w-full">
                                            <Label htmlFor="newPassword">
                                                New Password
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="newPassword"
                                                    type={
                                                        showNewPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    value={newPassword}
                                                    onChange={(e) =>
                                                        setNewPassword(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter new password"
                                                    className="pr-10 shadow-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowNewPassword(
                                                            !showNewPassword
                                                        )
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        {passwordError && (
                                            <p className="text-sm text-destructive">
                                                {passwordError}
                                            </p>
                                        )}
                                        {passwordSuccess && (
                                            <p className="text-sm text-green-600">
                                                Password changed successfully!
                                            </p>
                                        )}
                                        <Button
                                            onClick={handlePasswordChange}
                                            disabled={
                                                isChangingPassword ||
                                                !newPassword
                                            }
                                            className="w-fit shadow-none"
                                        >
                                            {isChangingPassword
                                                ? "Updating..."
                                                : "Update Password"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Quick Switch Section */}
                                <div className="space-y-3 p-4 bg-muted/50 rounded-md">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <KeyRound className="h-4 w-4" />
                                                <h4 className="text-sm font-medium">
                                                    Quick Switch
                                                </h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Use a 4-6 digit PIN to quickly
                                                switch back to your account
                                            </p>
                                        </div>
                                        <Switch
                                            checked={quickSwitchEnabled}
                                            onCheckedChange={
                                                handleQuickSwitchToggle
                                            }
                                            disabled={
                                                isLoadingPinStatus ||
                                                isSavingPin
                                            }
                                        />
                                    </div>

                                    {/* PIN Setup/Update Form - shown when enabled */}
                                    {quickSwitchEnabled && (
                                        <div className="space-y-3 pt-3 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                {quickSwitchEnabled
                                                    ? "Update your PIN"
                                                    : "Create a 4-6 digit PIN"}
                                            </p>
                                            <div className="flex flex-col gap-3 items-end">
                                                <div className="grid gap-2 w-full">
                                                    <Label htmlFor="pin">
                                                        New PIN
                                                    </Label>
                                                    <Input
                                                        id="pin"
                                                        type="password"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        maxLength={6}
                                                        value={pin}
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    ""
                                                                );
                                                            setPin(value);
                                                        }}
                                                        placeholder="Enter 4-6 digit PIN"
                                                        className="shadow-none w-full"
                                                    />
                                                </div>
                                                <div className="grid gap-2 w-full">
                                                    <Label htmlFor="confirmPin">
                                                        Confirm PIN
                                                    </Label>
                                                    <Input
                                                        id="confirmPin"
                                                        type="password"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        maxLength={6}
                                                        value={confirmPin}
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    ""
                                                                );
                                                            setConfirmPin(
                                                                value
                                                            );
                                                        }}
                                                        placeholder="Confirm your PIN"
                                                        className="shadow-none w-full"
                                                    />
                                                </div>
                                                {pinError && (
                                                    <p className="text-sm text-destructive">
                                                        {pinError}
                                                    </p>
                                                )}
                                                {pinSuccess && (
                                                    <p className="text-sm text-green-600">
                                                        PIN saved successfully!
                                                    </p>
                                                )}
                                                <Button
                                                    onClick={handleSavePin}
                                                    disabled={
                                                        isSavingPin ||
                                                        !pin ||
                                                        !confirmPin
                                                    }
                                                    className="shadow-none"
                                                >
                                                    {isSavingPin
                                                        ? "Saving..."
                                                        : "Save PIN"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
