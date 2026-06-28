import type { ReactNode } from "react";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
    children: ReactNode;
    label: ReactNode;
    side?: TooltipSide;
    shortcut?: string;
    disabled?: boolean;
}

const SIDE_CLASSES: Record<TooltipSide, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
};

export default function Tooltip({
    children,
    label,
    side = "top",
    shortcut,
    disabled = false,
}: TooltipProps) {
    if (disabled) return <>{children}</>;

    return (
        <span className="relative inline-flex group">
            {children}
            <span
                role="tooltip"
                className={[
                    "pointer-events-none absolute z-50 whitespace-nowrap",
                    "rounded-md border border-border-strong bg-surface-overlay px-2 py-1",
                    "text-[11px] font-medium text-text-primary shadow-md",
                    "opacity-0 scale-95 transition-[opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
                    "group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100",
                    "flex items-center gap-1.5",
                    SIDE_CLASSES[side],
                ].join(" ")}
            >
                {label}
                {shortcut && <span className="kbd">{shortcut}</span>}
            </span>
        </span>
    );
}
