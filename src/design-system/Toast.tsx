import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastItem, type ToastVariant } from "./toastStore";

const ICONS: Record<ToastVariant, typeof Info> = {
    neutral: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: XCircle,
};

const ICON_COLORS: Record<ToastVariant, string> = {
    neutral: "text-info-400",
    success: "text-success-500",
    warning: "text-warning-500",
    danger: "text-danger-500",
};

function ToastCard({ toast }: { toast: ToastItem }) {
    const dismiss = useToastStore((s) => s.dismiss);
    const Icon = ICONS[toast.variant];

    useEffect(() => {
        const timer = window.setTimeout(() => dismiss(toast.id), 4200);
        return () => window.clearTimeout(timer);
    }, [toast.id, dismiss]);

    return (
        <div
            role="status"
            className={[
                "flex items-start gap-2.5 w-80 rounded-lg border border-border-default bg-surface-overlay",
                "px-3.5 py-3 shadow-lg",
                "animate-[toast-in_var(--duration-slow)_var(--ease-out)]",
            ].join(" ")}
        >
            <Icon
                className={`w-4 h-4 mt-0.5 shrink-0 ${ICON_COLORS[toast.variant]}`}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary leading-tight">
                    {toast.title}
                </p>
                {toast.description && (
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                        {toast.description}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="text-text-tertiary hover:text-text-primary transition-colors shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default function ToastViewport() {
    const toasts = useToastStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastCard toast={t} />
                </div>
            ))}
        </div>
    );
}
