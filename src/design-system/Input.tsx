import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    mono?: boolean;
    invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { mono = false, invalid = false, className = "", ...rest },
    ref
) {
    return (
        <input
            ref={ref}
            className={[
                "w-full h-8 px-2.5 rounded-md text-sm",
                "bg-surface-raised border transition-colors duration-[var(--duration-fast)]",
                "placeholder:text-text-tertiary text-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500",
                invalid
                    ? "border-danger-500/60"
                    : "border-border-default hover:border-border-strong",
                mono ? "font-mono-tabular" : "",
                className,
            ].join(" ")}
            {...rest}
        />
    );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    mono?: boolean;
    invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    function Textarea(
        { mono = false, invalid = false, className = "", ...rest },
        ref
    ) {
        return (
            <textarea
                ref={ref}
                className={[
                    "w-full px-2.5 py-2 rounded-md text-sm resize-none",
                    "bg-surface-raised border transition-colors duration-[var(--duration-fast)]",
                    "placeholder:text-text-tertiary text-text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500",
                    invalid
                        ? "border-danger-500/60"
                        : "border-border-default hover:border-border-strong",
                    mono ? "font-mono-tabular" : "",
                    className,
                ].join(" ")}
                {...rest}
            />
        );
    }
);
