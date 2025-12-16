// Task-related type definitions

export interface TaskCategory {
    id: string;
    name: string;
    display_name: string;
    icon: string;
    color: string;
    default_duration_minutes: number;
    created_at?: string;
}

export interface ShiftTask {
    id: string;
    shift_id: string;
    assigned_to: string;
    patient_room: string | null;
    patient_name: string | null;
    task_type: string;
    task_subtype: string | null;
    title: string;
    description: string | null;
    priority: "critical" | "high" | "normal" | "low";
    scheduled_time: string;
    due_time: string | null;
    completed_at: string | null;
    status: "pending" | "in_progress" | "completed" | "skipped" | "overdue";
    position_x: number;
    position_y: number;
    depends_on: string[] | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface TaskTemplate {
    id: string;
    category_id: string;
    role: string | null;
    title: string;
    description: string | null;
    default_priority: "critical" | "high" | "normal" | "low";
    typical_duration_minutes: number;
    is_recurring: boolean;
    recurrence_interval_hours: number | null;
    created_at?: string;
}

// Form types for creating/updating tasks
export interface CreateTaskInput {
    shift_id: string;
    assigned_to: string;
    patient_room?: string | null;
    patient_name?: string | null;
    task_type: string;
    task_subtype?: string | null;
    title: string;
    description?: string | null;
    priority?: "critical" | "high" | "normal" | "low";
    scheduled_time: string;
    due_time?: string | null;
    status?: "pending" | "in_progress" | "completed" | "skipped" | "overdue";
    position_x?: number;
    position_y?: number;
    depends_on?: string[] | null;
    notes?: string | null;
}

export interface UpdateTaskInput {
    patient_room?: string | null;
    patient_name?: string | null;
    task_type?: string;
    task_subtype?: string | null;
    title?: string;
    description?: string | null;
    priority?: "critical" | "high" | "normal" | "low";
    scheduled_time?: string;
    due_time?: string | null;
    completed_at?: string | null;
    status?: "pending" | "in_progress" | "completed" | "skipped" | "overdue";
    position_x?: number;
    position_y?: number;
    depends_on?: string[] | null;
    notes?: string | null;
}

// Default task categories data for seeding
export const DEFAULT_TASK_CATEGORIES: Omit<
    TaskCategory,
    "id" | "created_at"
>[] = [
    {
        name: "medication",
        display_name: "Medication Administration",
        icon: "Pill",
        color: "#3B82F6",
        default_duration_minutes: 15,
    },
    {
        name: "vitals",
        display_name: "Vital Signs",
        icon: "HeartPulse",
        color: "#EF4444",
        default_duration_minutes: 10,
    },
    {
        name: "assessment",
        display_name: "Patient Assessment",
        icon: "Stethoscope",
        color: "#10B981",
        default_duration_minutes: 20,
    },
    {
        name: "procedure",
        display_name: "Medical Procedure",
        icon: "Syringe",
        color: "#F59E0B",
        default_duration_minutes: 30,
    },
    {
        name: "documentation",
        display_name: "Documentation",
        icon: "FileText",
        color: "#6366F1",
        default_duration_minutes: 15,
    },
    {
        name: "care",
        display_name: "Patient Care",
        icon: "HandHeart",
        color: "#EC4899",
        default_duration_minutes: 25,
    },
    {
        name: "communication",
        display_name: "Communication",
        icon: "MessageCircle",
        color: "#8B5CF6",
        default_duration_minutes: 15,
    },
    {
        name: "critical",
        display_name: "Critical Intervention",
        icon: "AlertTriangle",
        color: "#DC2626",
        default_duration_minutes: 45,
    },
];
