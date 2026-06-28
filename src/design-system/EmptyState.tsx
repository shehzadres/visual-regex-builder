import type { ReactNode } from "react";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    compact?: boolean;
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    compact = false,
}: EmptyStateProps) {
    return (
        <div
            className={[
                "flex flex-col items-center justify-center text-center gap-3",
                compact ? "py-8" : "py-16",
            ].join(" ")}
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-raised border border-border-subtle text-text-tertiary">
                {icon}
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
                <p className="text-sm font-medium text-text-primary">
                    {title}
                </p>
                {description && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
