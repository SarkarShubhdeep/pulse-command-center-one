"use client";

import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export function Canvas() {
    return (
        <div className="w-full h-full">
            <ReactFlow fitView proOptions={{ hideAttribution: true }}>
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                />
                <Controls
                    className="!bottom-4 !left-1/2 !-translate-x-1/2 !flex !flex-row !gap-1"
                    orientation="horizontal"
                />
                {/* <MiniMap className="!bottom-4 !right-4" /> */}
            </ReactFlow>
        </div>
    );
}
