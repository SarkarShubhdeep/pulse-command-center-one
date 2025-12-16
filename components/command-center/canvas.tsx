"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    useNodesState,
    useEdgesState,
    useReactFlow,
    addEdge,
    MarkerType,
    type Connection,
    type Edge,
    type EdgeChange,
    type NodeTypes,
    type OnNodesChange,
    type OnEdgesChange,
    type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Spline, SplinePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskNode, TaskFormDialog, type TaskNodeType } from "./nodes";
import { useShiftTasks } from "@/hooks/use-shift-tasks";
import { useTaskCategories } from "@/hooks/use-task-categories";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useNurseShift } from "@/hooks/use-nurse-shift";
import { ShiftTask, CreateTaskInput, UpdateTaskInput } from "@/lib/types/tasks";

interface CanvasProps {
    controlsVisible?: boolean;
}

const nodeTypes: NodeTypes = {
    task: TaskNode,
};

export function Canvas({ controlsVisible = true }: CanvasProps) {
    const { user } = useAuthUser();
    const { shift } = useNurseShift(user?.id);
    const { categories, seedCategories } = useTaskCategories();
    const {
        tasks,
        createTask,
        updateTask,
        deleteTask,
        updateTaskPosition,
        updateTaskStatus,
    } = useShiftTasks(shift?.id);

    const { setCenter } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<TaskNodeType>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ShiftTask | null>(null);
    const [connectionMode, setConnectionMode] = useState(false);
    const pendingCenterRef = useRef<{ x: number; y: number } | null>(null);

    // Keyboard shortcuts: ESC to exit connection mode, X to toggle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            )
                return;

            if (e.key === "Escape" && connectionMode) {
                setConnectionMode(false);
            } else if (e.key.toLowerCase() === "x") {
                setConnectionMode((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [connectionMode]);

    // Define handlers first so they can be used in useEffect
    const handleStatusChange = useCallback(
        async (taskId: string, status: ShiftTask["status"]) => {
            await updateTaskStatus(taskId, status);
        },
        [updateTaskStatus]
    );

    const handleEditTask = useCallback((task: ShiftTask) => {
        setEditingTask(task);
        setDialogOpen(true);
    }, []);

    const handleDeleteTask = useCallback(
        async (taskId: string) => {
            await deleteTask(taskId);
        },
        [deleteTask]
    );

    // Seed categories on mount if needed
    useEffect(() => {
        if (categories.length === 0) {
            seedCategories();
        }
    }, [categories.length, seedCategories]);

    // Convert tasks to React Flow nodes
    useEffect(() => {
        const taskNodes: TaskNodeType[] = tasks.map((task) => {
            const category = categories.find((c) => c.name === task.task_type);
            return {
                id: task.id,
                type: "task",
                position: { x: task.position_x, y: task.position_y },
                data: {
                    task,
                    category,
                    connectionMode,
                    onStatusChange: handleStatusChange,
                    onEdit: handleEditTask,
                    onDelete: handleDeleteTask,
                },
            };
        });
        setNodes(taskNodes);

        // Create edges for task dependencies - merge with existing user-created edges
        setEdges((currentEdges) => {
            const dependencyEdges: Edge[] = [];
            tasks.forEach((task) => {
                if (task.depends_on && task.depends_on.length > 0) {
                    task.depends_on.forEach((depId) => {
                        dependencyEdges.push({
                            id: `dep-${depId}-${task.id}`,
                            source: depId,
                            target: task.id,
                            type: "default",
                            animated: task.status === "in_progress",
                            style: { stroke: "#64748b", strokeWidth: 2 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: "#64748b",
                            },
                        });
                    });
                }
            });

            // Keep user-created edges (those not starting with 'dep-')
            const userEdges = currentEdges.filter(
                (e) => !e.id.startsWith("dep-")
            );

            // Merge: dependency edges + user edges (avoid duplicates)
            const allEdgeIds = new Set(dependencyEdges.map((e) => e.id));
            const uniqueUserEdges = userEdges.filter(
                (e) => !allEdgeIds.has(e.id)
            );

            return [...dependencyEdges, ...uniqueUserEdges];
        });
    }, [
        tasks,
        categories,
        connectionMode,
        handleStatusChange,
        handleEditTask,
        handleDeleteTask,
        setNodes,
        setEdges,
    ]);

    const handleNodesChange: OnNodesChange<TaskNodeType> = useCallback(
        (changes: NodeChange<TaskNodeType>[]) => {
            onNodesChange(changes);

            // Handle position changes (drag end)
            changes.forEach((change) => {
                if (
                    change.type === "position" &&
                    change.dragging === false &&
                    change.position
                ) {
                    updateTaskPosition(
                        change.id,
                        change.position.x,
                        change.position.y
                    );
                }
            });
        },
        [onNodesChange, updateTaskPosition]
    );

    const onConnect = useCallback(
        (params: Connection) => {
            if (!connectionMode) return; // Only allow connections in connection mode
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        type: "default",
                        style: { stroke: "#64748b", strokeWidth: 2 },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: "#64748b",
                        },
                    },
                    eds
                )
            );
        },
        [setEdges, connectionMode]
    );

    // Click on edge to delete it
    const onEdgeClick = useCallback(
        (_: React.MouseEvent, edge: Edge) => {
            setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        },
        [setEdges]
    );

    const handleEdgesChange: OnEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            onEdgesChange(changes);
        },
        [onEdgesChange]
    );

    const handleSaveTask = useCallback(
        async (input: CreateTaskInput | UpdateTaskInput, taskId?: string) => {
            if (taskId) {
                await updateTask(taskId, input as UpdateTaskInput);
            } else {
                const newTask = await createTask(input as CreateTaskInput);
                if (newTask) {
                    // Store position to center on after nodes update
                    pendingCenterRef.current = {
                        x: newTask.position_x,
                        y: newTask.position_y,
                    };
                }
            }
        },
        [createTask, updateTask]
    );

    // Center on newly created task
    useEffect(() => {
        if (pendingCenterRef.current && nodes.length > 0) {
            const { x, y } = pendingCenterRef.current;
            // Small delay to ensure node is rendered
            setTimeout(() => {
                setCenter(x + 125, y + 75, { zoom: 1, duration: 300 });
            }, 100);
            pendingCenterRef.current = null;
        }
    }, [nodes, setCenter]);

    const handleCreateNew = useCallback(() => {
        setEditingTask(null);
        setDialogOpen(true);
    }, []);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
                nodesDraggable={!connectionMode}
                nodesConnectable={connectionMode}
                elementsSelectable={!connectionMode}
                defaultEdgeOptions={{
                    type: "default",
                    style: { stroke: "#64748b", strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: "#64748b",
                    },
                }}
                className={connectionMode ? "cursor-crosshair" : ""}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                />
                {controlsVisible && (
                    <Controls
                        className="!bottom-4 !left-1/2 !-translate-x-1/2 !flex !flex-row !gap-1 dark:[&_button]:!bg-slate-800 dark:[&_button]:!border-slate-700 dark:[&_button]:!text-slate-200 dark:[&_button]:hover:!bg-slate-700"
                        orientation="horizontal"
                    />
                )}
            </ReactFlow>

            {/* Action Buttons */}
            {shift && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 pointer-events-none">
                    <div className="flex gap-2 pointer-events-auto">
                        <Button
                            onClick={handleCreateNew}
                            className="gap-2 p-3 rounded-full bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-5 h-5" />
                            Add Task
                        </Button>
                        <Button
                            onClick={() => setConnectionMode(!connectionMode)}
                            variant={connectionMode ? "default" : "outline"}
                            size={connectionMode ? "default" : "icon"}
                            className={
                                connectionMode
                                    ? "gap-2 p-3 rounded-full bg-foreground hover:bg-foreground/80 text-background"
                                    : "gap-2 p-3 rounded-full"
                            }
                        >
                            {connectionMode ? (
                                <>
                                    <SplinePointer className="w-5 h-5" />
                                    Connection Mode ON
                                </>
                            ) : (
                                <>
                                    <Spline className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Task Form Dialog */}
            {shift && user && (
                <TaskFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    task={editingTask}
                    categories={categories}
                    shiftId={shift.id}
                    assignedTo={user.id}
                    onSave={handleSaveTask}
                    onDelete={handleDeleteTask}
                />
            )}
        </div>
    );
}
