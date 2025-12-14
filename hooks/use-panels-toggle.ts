"use client";

import { useState, useEffect, useCallback } from "react";

export function usePanelsToggle(initialState = true) {
    const [panelsVisible, setPanelsVisible] = useState(initialState);
    const [controlsVisible, setControlsVisible] = useState(initialState);

    const togglePanels = useCallback(() => {
        setPanelsVisible((prev) => !prev);
    }, []);

    const toggleControls = useCallback(() => {
        setControlsVisible((prev) => !prev);
    }, []);

    const toggleAll = useCallback(() => {
        setPanelsVisible((prev) => !prev);
        setControlsVisible((prev) => !prev);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
                event.preventDefault();
                toggleAll();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleAll]);

    return {
        panelsVisible,
        togglePanels,
        controlsVisible,
        toggleControls,
        toggleAll,
    };
}
