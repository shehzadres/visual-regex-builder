import type { ReactNode } from "react";

type BadgeVariant =
    | "neutral"
    | "accent"
    | "success"
    | "warning"
    | "danger"
    | "info";

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    dot?: boolean;
    className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    neutral: "bg-surface-raised text-text-secondary border-border-default",
    accent: "bg-accent-500/10 text-accent-300 border-accent-500/30",
    success: "bg-success-bg text-success-300 border-success-600/30",
    warning: "bg-warning-bg text-warning-300 border-warning-600/30",
    danger: "bg-danger-bg text-danger-300 border-danger-600/30",
    info: "bg-info-bg text-info-300 border-info-600/30",
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
    neutral: "bg-text-tertiary",
    accent: "bg-accent-400",
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    info: "bg-info-500",
};

export default function Badge({
    children,
    variant = "neutral",
    dot = false,
    className = "",
}: BadgeProps) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
                "text-[11px] font-medium leading-4 whitespace-nowrap",
                VARIANT_CLASSES[variant],
                className,
            ].join(" ")}
        >
            {dot && (
                <span
                    className={[
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        DOT_CLASSES[variant],
                    ].join(" ")}
                />
            )}
            {children}
        </span>
    );
}
