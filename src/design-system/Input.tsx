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
                "w-full h-9 px-3 rounded-lg text-[13px]",
                "bg-surface border transition-colors duration-[var(--duration-fast)]",
                "placeholder:text-text-tertiary text-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500",
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
                    "w-full px-3 py-2.5 rounded-lg text-[13px] resize-none",
                    "bg-surface border transition-colors duration-[var(--duration-fast)]",
                    "placeholder:text-text-tertiary text-text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500",
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
