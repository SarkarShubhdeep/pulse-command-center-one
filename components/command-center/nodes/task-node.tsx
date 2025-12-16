"use client";

import { memo } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
import {
    Pill,
    HeartPulse,
    Stethoscope,
    Syringe,
    FileText,
    Heart,
    MessageCircle,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Circle,
    Loader2,
    XCircle,
} from "lucide-react";
import { ShiftTask, TaskCategory } from "@/lib/types/tasks";
import { cn } from "@/lib/utils";

// Icon mapping for task types
const TASK_ICONS: Record<
    string,
    React.ComponentType<{ className?: string }>
> = {
    Pill: Pill,
    HeartPulse: HeartPulse,
    Stethoscope: Stethoscope,
    Syringe: Syringe,
    FileText: FileText,
    HandHeart: Heart,
    MessageCircle: MessageCircle,
    AlertTriangle: AlertTriangle,
};

// Status icons
const STATUS_ICONS: Record<
    ShiftTask["status"],
    React.ComponentType<{ className?: string }>
> = {
    pending: Circle,
    in_progress: Loader2,
    completed: CheckCircle2,
    skipped: XCircle,
    overdue: AlertTriangle,
};

// Status colors
const STATUS_COLORS: Record<ShiftTask["status"], string> = {
    pending: "text-muted-foreground",
    in_progress: "text-blue-500 animate-spin",
    completed: "text-green-500",
    skipped: "text-muted-foreground",
    overdue: "text-red-500",
};

// Priority badge styles
const PRIORITY_STYLES: Record<ShiftTask["priority"], string> = {
    critical: "bg-red-500/20 text-red-500 border-red-500/30",
    high: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    normal: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    low: "bg-muted text-muted-foreground border-border",
};

export interface TaskNodeData extends Record<string, unknown> {
    task: ShiftTask;
    category?: TaskCategory;
    connectionMode?: boolean;
    onStatusChange?: (taskId: string, status: ShiftTask["status"]) => void;
    onEdit?: (task: ShiftTask) => void;
    onDelete?: (taskId: string) => void;
}

export type TaskNodeType = Node<TaskNodeData, "task">;

interface TaskNodeProps {
    data: TaskNodeData;
    selected?: boolean;
}

function TaskNodeComponent({ data, selected }: TaskNodeProps) {
    const { task, category, connectionMode, onStatusChange, onEdit } = data;

    const IconComponent = category?.icon ? TASK_ICONS[category.icon] : Circle;
    const StatusIcon = STATUS_ICONS[task.status];
    const categoryColor = category?.color || "#6366F1";

    const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const handleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onStatusChange) return;

        const statusOrder: ShiftTask["status"][] = [
            "pending",
            "in_progress",
            "completed",
        ];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        onStatusChange(task.id, nextStatus);
    };

    const handleDoubleClick = () => {
        if (onEdit) {
            onEdit(task);
        }
    };

    return (
        <div
            className={cn(
                "min-w-[220px] max-w-[280px] rounded-lg border shadow-lg transition-all duration-200",
                "bg-card backdrop-blur-sm",
                selected ? "ring-2 ring-offset-2 ring-offset-background" : "",
                task.status === "completed" && "opacity-70"
            )}
            style={{
                borderColor: categoryColor,
                boxShadow: selected ? `0 0 20px ${categoryColor}40` : undefined,
            }}
            onDoubleClick={handleDoubleClick}
        >
            {/* Header */}
            <div
                className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
                style={{ backgroundColor: `${categoryColor}20` }}
            >
                <div
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${categoryColor}30` }}
                >
                    {IconComponent && (
                        <IconComponent
                            className="w-4 h-4"
                            style={{ color: categoryColor }}
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">
                        {category?.display_name || task.task_type}
                    </p>
                </div>
                <button
                    onClick={handleStatusClick}
                    className="p-1 rounded hover:bg-muted/50 transition-colors"
                    title={`Status: ${task.status}`}
                >
                    <StatusIcon
                        className={cn("w-4 h-4", STATUS_COLORS[task.status])}
                    />
                </button>
            </div>

            {/* Content */}
            <div className="px-3 py-2 space-y-2">
                <h3
                    className={cn(
                        "text-sm font-semibold text-card-foreground line-clamp-2",
                        task.status === "completed" &&
                            "line-through text-muted-foreground"
                    )}
                >
                    {task.title}
                </h3>

                {task.patient_name && (
                    <p className="text-xs text-muted-foreground">
                        <span className="text-muted-foreground/70">
                            Patient:
                        </span>{" "}
                        {task.patient_name}
                        {task.patient_room && (
                            <span className="text-muted-foreground/70">
                                {" "}
                                • Room {task.patient_room}
                            </span>
                        )}
                    </p>
                )}

                {task.description && (
                    <p className="text-xs text-muted-foreground/70 line-clamp-2">
                        {task.description}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(task.scheduled_time)}</span>
                    {task.due_time && (
                        <span className="text-muted-foreground/70">
                            - {formatTime(task.due_time)}
                        </span>
                    )}
                </div>
                <span
                    className={cn(
                        "px-2 py-0.5 text-[10px] font-medium rounded-full border",
                        PRIORITY_STYLES[task.priority]
                    )}
                >
                    {task.priority}
                </span>
            </div>

            {/* Target handles on all 4 sides - hidden for flexible drop targets */}
            <Handle
                type="target"
                id="target-top"
                position={Position.Top}
                className="!w-full !h-2 !top-0 !left-0 !transform-none !rounded-none !opacity-0"
            />
            <Handle
                type="target"
                id="target-right"
                position={Position.Right}
                className="!w-2 !h-full !top-0 !right-0 !left-auto !transform-none !rounded-none !opacity-0"
            />
            <Handle
                type="target"
                id="target-bottom"
                position={Position.Bottom}
                className="!w-full !h-2 !bottom-0 !top-auto !left-0 !transform-none !rounded-none !opacity-0"
            />
            <Handle
                type="target"
                id="target-left"
                position={Position.Left}
                className="!w-2 !h-full !top-0 !left-0 !transform-none !rounded-none !opacity-0"
            />
            {/* Source handle - visible only in connection mode */}
            <Handle
                type="source"
                id="source-right"
                position={Position.Right}
                className={
                    connectionMode
                        ? "!w-3 !h-3 !bg-muted !border-2 !border-muted-foreground"
                        : "!w-0 !h-0 !opacity-0"
                }
            />
        </div>
    );
}

export const TaskNode = memo(TaskNodeComponent);
