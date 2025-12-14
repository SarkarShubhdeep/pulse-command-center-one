"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { Label } from "./ui/label";

interface StaffCardProps {
    name: string;
    role: string;
    onQuickLogin?: (pin: string) => void;
}

export function StaffCard({ name, role, onQuickLogin }: StaffCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [pin, setPin] = useState("");
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const handleClick = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({ top: rect.top, left: rect.left });
        }
        setIsExpanded(true);
    };

    const handleClose = () => {
        setIsExpanded(false);
        setPin("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin && onQuickLogin) {
            onQuickLogin(pin);
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                className="text-left ring-[0.5px] ring-transparent ring-offset-4 transition-all duration-150 hover:ring-blue-300 hover:ring-offset-1 p-2"
                onClick={handleClick}
            >
                <div className="w-16 h-16 aspect-square bg-gray-200 rounded-lg mb-2" />
                <p className="text-sm font-medium text-gray-900">{name}</p>
                <p className="text-xs text-gray-500">{role}</p>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-40"
                            onClick={handleClose}
                        />

                        {/* Expanded Card */}
                        <motion.div
                            initial={{
                                opacity: 0,

                                top: `${position.top}px`,
                                left: `${position.left - 20}px`,
                            }}
                            animate={{
                                opacity: 1,
                                top: position.top,
                                left: position.left,
                            }}
                            exit={{
                                opacity: 0,
                                left: `${position.left + 20}px`,
                            }}
                            transition={{
                                type: "spring",
                                bounce: 0.2,
                                duration: 0.3,
                            }}
                            className="fixed z-50 bg-zinc-900 rounded-xl shadow-2xl p-4 w-64"
                            style={{ top: position.top, left: position.left }}
                        >
                            {/* Avatar, Name, Role */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-16 h-16 aspect-square bg-zinc-700 rounded-lg flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {role}
                                    </p>
                                </div>
                            </div>

                            <Label className="text-xs mt-6 text-muted-foreground mb-2 block">
                                Quickly login using your PIN
                            </Label>
                            {/* PIN Input */}
                            <form
                                onSubmit={handleSubmit}
                                className="flex gap-2"
                            >
                                <Input
                                    type="password"
                                    placeholder="Quick PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="h-10 text-sm bg-zinc-800 border-none text-white placeholder:text-zinc-400"
                                    autoFocus
                                    maxLength={6}
                                />
                                <button
                                    type="submit"
                                    disabled={!pin}
                                    className="h-10 w-10 flex items-center justify-center bg-background  rounded-md hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
