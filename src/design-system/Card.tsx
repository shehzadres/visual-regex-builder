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
                "rounded-lg bg-surface-raised border border-border-subtle",
                padded ? "p-3" : "",
                interactive
                    ? "transition-[border-color,transform] duration-[var(--duration-fast)] hover:border-border-strong cursor-pointer active:scale-[0.99]"
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
    accent: "text-accent-300",
    success: "text-success-300",
    warning: "text-warning-300",
    danger: "text-danger-300",
};

export function StatCard({
    label,
    value,
    sublabel,
    accent = "neutral",
}: StatCardProps) {
    return (
        <Card className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary truncate">
                {label}
            </span>
            <span
                className={[
                    "text-xl font-semibold font-mono-tabular truncate",
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
        </Card>
    );
}
