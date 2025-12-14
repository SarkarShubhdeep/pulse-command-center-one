"use client";

import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface CanvasProps {
    controlsVisible?: boolean;
}

export function Canvas({ controlsVisible = true }: CanvasProps) {
    return (
        <div className="w-full h-full">
            <ReactFlow fitView proOptions={{ hideAttribution: true }}>
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
                {/* <MiniMap className="!bottom-4 !right-4" /> */}
            </ReactFlow>
        </div>
    );
}
