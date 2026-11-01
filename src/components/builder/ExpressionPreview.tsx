import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import { useRegexStore } from "../../store/regexStore";
import Button from "../../design-system/Button";
import { AlertCircle, CheckCircle2, Copy, Regex } from "lucide-react";
import { toast } from "../../design-system/toastStore";

export default function ExpressionPreview() {
    const { pattern, isValid, error } = useRegexMatcher();
    const flags = useRegexStore((s) => s.flags);

    const handleCopy = async () => {
        if (!pattern) return;
        try {
            await navigator.clipboard.writeText(`/${pattern}/${flags}`);
            toast({
                title: "Expression copied",
                description: "The generated regex is on your clipboard.",
                variant: "success",
            });
        } catch {
            toast({
                title: "Clipboard unavailable",
                description: "Copy the expression from the Regex tab instead.",
                variant: "warning",
            });
        }
    };

    return (
        <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 min-h-[64px]">
            <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-50 text-accent-600">
                    <Regex className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-semibold text-text-primary">Expression</span>
                    <span className="text-[10px] text-text-tertiary">Live output</span>
                </div>
            </div>
            <div className="h-8 w-px bg-border-subtle shrink-0" />
            <code className="flex-1 min-w-0 truncate font-mono-tabular text-[12px] text-text-primary">
                {pattern ? `/${pattern}/${flags}` : "Your expression will appear here"}
            </code>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-text-secondary shrink-0" title={error ?? undefined}>
                {pattern === "" ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-text-disabled" />
                ) : isValid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-danger-500" />
                )}
                {pattern === "" ? "Waiting" : isValid ? "Valid" : "Invalid"}
            </div>
            <Button
                variant="secondary"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={handleCopy}
                disabled={pattern === ""}
            >
                Copy
            </Button>
        </div>
    );
}
