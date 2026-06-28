import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
};

export default function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = "md",
}: ModalProps) {
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="absolute inset-0 bg-black/60 animate-[panel-fade-in_var(--duration-base)_var(--ease-out)]"
                onClick={onClose}
            />
            <div
                className={[
                    "relative w-full rounded-xl bg-surface-overlay border border-border-default shadow-lg",
                    "animate-[panel-fade-in_var(--duration-base)_var(--ease-out)]",
                    SIZE_CLASSES[size],
                ].join(" ")}
            >
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                    <div>
                        <h2
                            id="modal-title"
                            className="text-sm font-semibold text-text-primary"
                        >
                            {title}
                        </h2>
                        {description && (
                            <p className="text-xs text-text-secondary mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="text-text-tertiary hover:text-text-primary transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
                {footer && (
                    <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border-subtle">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
