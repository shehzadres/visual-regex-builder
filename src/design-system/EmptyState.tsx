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
                compact ? "py-9" : "py-20",
            ].join(" ")}
        >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-50 text-accent-600">
                {icon}
            </div>
            <div className="flex flex-col gap-1.5 max-w-sm">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-text-primary">
                    {title}
                </p>
                {description && (
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
