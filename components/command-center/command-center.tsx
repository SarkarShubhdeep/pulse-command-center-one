"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./canvas";
import {
    TopLeftPanel,
    BottomLeftPanel,
    TopRightPanel,
    BottomRightPanel,
} from "./panels";
import { usePanelsToggle } from "@/hooks/use-panels-toggle";

export function CommandCenter() {
    const { panelsVisible, controlsVisible } = usePanelsToggle();

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-background">
            {/* React Flow Canvas - Base Layer */}
            <div className="absolute inset-0 z-0">
                <ReactFlowProvider>
                    <Canvas controlsVisible={controlsVisible} />
                </ReactFlowProvider>
            </div>

            {/* Floating Panels - z-50 */}
            <div
                className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-200 ${
                    panelsVisible ? "opacity-100" : "opacity-0"
                }`}
            >
                {/* Left Side Panels */}
                <div className="absolute left-4 top-4 bottom-4 flex flex-col justify-between pointer-events-auto">
                    <TopLeftPanel />
                    <BottomLeftPanel />
                </div>

                {/* Right Side Panels */}
                <div className="absolute right-4 top-4 bottom-4 flex flex-col justify-between pointer-events-auto">
                    <TopRightPanel />
                    <BottomRightPanel />
                </div>
            </div>
        </div>
    );
}
