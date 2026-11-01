import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    padded?: boolean;
    interactive?: boolean;
}

export default function Card({
    children,
    padded = true,
    interactive = false,
    className = "",
    ...rest
}: CardProps) {
    return (
        <div
            className={[
                "rounded-xl bg-surface border border-border-subtle",
                padded ? "p-4" : "",
                interactive
                    ? "transition-[background-color,border-color,transform] duration-[var(--duration-fast)] hover:bg-surface-overlay hover:border-border-default cursor-pointer active:scale-[0.995]"
                    : "",
                className,
            ].join(" ")}
            {...rest}
        >
            {children}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: ReactNode;
    sublabel?: string;
    accent?: "neutral" | "accent" | "success" | "warning" | "danger";
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
    neutral: "text-text-primary",
    accent: "text-accent-600",
    success: "text-success-500",
    warning: "text-warning-500",
    danger: "text-danger-500",
};

export function StatCard({
    label,
    value,
    sublabel,
    accent = "neutral",
}: StatCardProps) {
    return (
        <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border-subtle bg-canvas px-3 py-3">
            <span className="text-[11px] font-medium text-text-tertiary truncate">
                {label}
            </span>
            <span
                className={[
                    "text-xl font-semibold font-mono-tabular tracking-[-0.04em] truncate",
                    ACCENT_CLASSES[accent],
                ].join(" ")}
            >
                {value}
            </span>
            {sublabel && (
                <span className="text-[11px] text-text-secondary truncate">
                    {sublabel}
                </span>
            )}
        </div>
    );
}
