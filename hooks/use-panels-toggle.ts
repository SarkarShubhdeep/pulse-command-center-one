"use client";

import { useState, useEffect, useCallback } from "react";

export function usePanelsToggle(initialState = true) {
    const [panelsVisible, setPanelsVisible] = useState(initialState);

    const togglePanels = useCallback(() => {
        setPanelsVisible((prev) => !prev);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "/") {
                event.preventDefault();
                togglePanels();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [togglePanels]);

    return { panelsVisible, togglePanels };
}
