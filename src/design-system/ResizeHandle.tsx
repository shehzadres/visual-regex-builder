import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface ResizeHandleProps {
    direction: "horizontal" | "vertical";
    onResize: (delta: number) => void;
    /** Which edge this handle represents — affects the resize sign and cursor. */
    edge: "left" | "right" | "top" | "bottom";
    className?: string;
}

export default function ResizeHandle({
    direction,
    onResize,
    edge,
    className = "",
}: ResizeHandleProps) {
    const draggingRef = useRef(false);
    const lastPosRef = useRef(0);

    const handlePointerMove = useCallback(
        (e: globalThis.PointerEvent) => {
            if (!draggingRef.current) return;
            const pos = direction === "horizontal" ? e.clientX : e.clientY;
            const rawDelta = pos - lastPosRef.current;
            lastPosRef.current = pos;
            const sign = edge === "right" || edge === "bottom" ? 1 : -1;
            onResize(rawDelta * sign);
        },
        [direction, edge, onResize]
    );

    const stopDragging = useCallback(() => {
        draggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }, []);

    useEffect(() => {
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", stopDragging);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", stopDragging);
        };
    }, [handlePointerMove, stopDragging]);

    const handlePointerDown = (e: ReactPointerEvent) => {
        draggingRef.current = true;
        lastPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
        document.body.style.cursor =
            direction === "horizontal" ? "col-resize" : "row-resize";
        document.body.style.userSelect = "none";
    };

    return (
        <div
            role="separator"
            aria-orientation={
                direction === "horizontal" ? "vertical" : "horizontal"
            }
            onPointerDown={handlePointerDown}
            className={[
                "group shrink-0 relative z-10",
                direction === "horizontal"
                    ? "w-1 cursor-col-resize"
                    : "h-1 cursor-row-resize",
                className,
            ].join(" ")}
        >
            <div
                className={[
                    "absolute bg-transparent group-hover:bg-accent-500/40 transition-colors duration-[var(--duration-fast)]",
                    direction === "horizontal"
                        ? "inset-y-0 left-0 right-0"
                        : "inset-x-0 top-0 bottom-0",
                ].join(" ")}
            />
        </div>
    );
}
