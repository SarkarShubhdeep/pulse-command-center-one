"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ShiftTask,
    TaskCategory,
    CreateTaskInput,
    UpdateTaskInput,
} from "@/lib/types/tasks";
import { cn } from "@/lib/utils";

interface TaskFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: ShiftTask | null;
    categories: TaskCategory[];
    shiftId: string;
    assignedTo: string;
    onSave: (
        input: CreateTaskInput | UpdateTaskInput,
        taskId?: string
    ) => Promise<void>;
    onDelete?: (taskId: string) => Promise<void>;
}

const PRIORITY_OPTIONS: ShiftTask["priority"][] = [
    "low",
    "normal",
    "high",
    "critical",
];
const STATUS_OPTIONS: ShiftTask["status"][] = [
    "pending",
    "in_progress",
    "completed",
    "skipped",
];

export function TaskFormDialog({
    open,
    onOpenChange,
    task,
    categories,
    shiftId,
    assignedTo,
    onSave,
    onDelete,
}: TaskFormDialogProps) {
    const isEditing = !!task;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        task_type: "",
        task_subtype: "",
        patient_name: "",
        patient_room: "",
        priority: "normal" as ShiftTask["priority"],
        status: "pending" as ShiftTask["status"],
        scheduled_time: "",
        due_time: "",
        notes: "",
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || "",
                description: task.description || "",
                task_type: task.task_type || "",
                task_subtype: task.task_subtype || "",
                patient_name: task.patient_name || "",
                patient_room: task.patient_room || "",
                priority: task.priority || "normal",
                status: task.status || "pending",
                scheduled_time: task.scheduled_time
                    ? formatDateTimeLocal(task.scheduled_time)
                    : "",
                due_time: task.due_time
                    ? formatDateTimeLocal(task.due_time)
                    : "",
                notes: task.notes || "",
            });
        } else {
            // Reset form for new task
            const now = new Date();
            setFormData({
                title: "",
                description: "",
                task_type: categories[0]?.name || "",
                task_subtype: "",
                patient_name: "",
                patient_room: "",
                priority: "normal",
                status: "pending",
                scheduled_time: formatDateTimeLocal(now.toISOString()),
                due_time: "",
                notes: "",
            });
        }
    }, [task, categories, open]);

    const formatDateTimeLocal = (isoString: string) => {
        const date = new Date(isoString);
        // Format as local datetime for datetime-local input (YYYY-MM-DDTHH:mm)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const localToISOString = (localDatetime: string) => {
        // Convert local datetime-local value to ISO string
        const date = new Date(localDatetime);
        return date.toISOString();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isEditing && task) {
                const updateInput: UpdateTaskInput = {
                    title: formData.title,
                    description: formData.description || null,
                    task_type: formData.task_type,
                    task_subtype: formData.task_subtype || null,
                    patient_name: formData.patient_name || null,
                    patient_room: formData.patient_room || null,
                    priority: formData.priority,
                    status: formData.status,
                    scheduled_time: localToISOString(formData.scheduled_time),
                    due_time: formData.due_time
                        ? localToISOString(formData.due_time)
                        : null,
                    notes: formData.notes || null,
                };
                await onSave(updateInput, task.id);
            } else {
                const createInput: CreateTaskInput = {
                    shift_id: shiftId,
                    assigned_to: assignedTo,
                    title: formData.title,
                    description: formData.description || null,
                    task_type: formData.task_type,
                    task_subtype: formData.task_subtype || null,
                    patient_name: formData.patient_name || null,
                    patient_room: formData.patient_room || null,
                    priority: formData.priority,
                    status: formData.status,
                    scheduled_time: localToISOString(formData.scheduled_time),
                    due_time: formData.due_time
                        ? localToISOString(formData.due_time)
                        : null,
                    notes: formData.notes || null,
                    position_x: Math.random() * 500 + 100,
                    position_y: Math.random() * 300 + 100,
                };
                await onSave(createInput);
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save task:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !onDelete) return;

        if (confirm("Are you sure you want to delete this task?")) {
            setSaving(true);
            try {
                await onDelete(task.id);
                onOpenChange(false);
            } catch (error) {
                console.error("Failed to delete task:", error);
            } finally {
                setSaving(false);
            }
        }
    };

    const selectedCategory = categories.find(
        (c) => c.name === formData.task_type
    );

    // Get short label for category - use name if display_name would create duplicates
    const getCategoryLabel = (cat: TaskCategory) => {
        const firstWord = cat.display_name.split(" ")[0];
        // Check if this first word appears in other categories
        const duplicates = categories.filter(
            (c) => c.display_name.split(" ")[0] === firstWord
        );
        if (duplicates.length > 1) {
            // Use full name or abbreviated version
            return cat.name.charAt(0).toUpperCase() + cat.name.slice(1);
        }
        return firstWord;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Task" : "Create New Task"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                            placeholder="Task title"
                            required
                        />
                    </div>

                    {/* Task Type (Category) */}
                    <div className="space-y-2">
                        <Label>Task Type *</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            task_type: cat.name,
                                            // Auto-set priority to critical when task type is critical
                                            priority:
                                                cat.name === "critical"
                                                    ? "critical"
                                                    : prev.priority,
                                        }))
                                    }
                                    className={cn(
                                        "p-2 rounded-lg border text-xs font-medium transition-all",
                                        formData.task_type === cat.name
                                            ? "border-2"
                                            : "border-border hover:border-muted-foreground/50"
                                    )}
                                    style={{
                                        borderColor:
                                            formData.task_type === cat.name
                                                ? cat.color
                                                : undefined,
                                        backgroundColor:
                                            formData.task_type === cat.name
                                                ? `${cat.color}20`
                                                : undefined,
                                        color:
                                            formData.task_type === cat.name
                                                ? cat.color
                                                : undefined,
                                    }}
                                >
                                    {getCategoryLabel(cat)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Task description"
                            rows={2}
                            className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Patient Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patient_name">Patient Name</Label>
                            <Input
                                id="patient_name"
                                value={formData.patient_name}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        patient_name: e.target.value,
                                    }))
                                }
                                placeholder="Patient name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient_room">Room</Label>
                            <Input
                                id="patient_room"
                                value={formData.patient_room}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        patient_room: e.target.value,
                                    }))
                                }
                                placeholder="Room number"
                            />
                        </div>
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduled_time">
                                Scheduled Time *
                            </Label>
                            <Input
                                id="scheduled_time"
                                type="datetime-local"
                                value={formData.scheduled_time}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        scheduled_time: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due_time">Due Time</Label>
                            <Input
                                id="due_time"
                                type="datetime-local"
                                value={formData.due_time}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        due_time: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    {/* Priority & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <div className="flex gap-1">
                                {PRIORITY_OPTIONS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                priority: p,
                                            }))
                                        }
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-medium rounded border transition-all capitalize",
                                            formData.priority === p
                                                ? p === "critical"
                                                    ? "bg-red-500/20 text-red-500 border-red-500"
                                                    : p === "high"
                                                    ? "bg-orange-500/20 text-orange-500 border-orange-500"
                                                    : p === "normal"
                                                    ? "bg-blue-500/20 text-blue-500 border-blue-500"
                                                    : "bg-muted text-muted-foreground border-muted-foreground"
                                                : "bg-background text-muted-foreground border-border hover:border-muted-foreground/50"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {isEditing && (
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            status: e.target
                                                .value as ShiftTask["status"],
                                        }))
                                    }
                                    className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option
                                            key={s}
                                            value={s}
                                            className="capitalize"
                                        >
                                            {s.replace("_", " ")}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                }))
                            }
                            placeholder="Additional notes"
                            rows={2}
                            className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <DialogFooter className="flex gap-2 pt-4">
                        {isEditing && onDelete && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={saving}
                                className="mr-auto"
                            >
                                Delete
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                saving ||
                                !formData.title ||
                                !formData.task_type ||
                                !formData.scheduled_time
                            }
                            style={{ backgroundColor: selectedCategory?.color }}
                        >
                            {saving
                                ? "Saving..."
                                : isEditing
                                ? "Update Task"
                                : "Create Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
