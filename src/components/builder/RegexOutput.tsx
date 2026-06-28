import { Copy, CheckCircle2, XCircle } from "lucide-react";
import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import { useRegexStore } from "../../store/regexStore";
import { Textarea } from "../../design-system/Input";
import Button from "../../design-system/Button";
import Badge from "../../design-system/Badge";
import { toast } from "../../design-system/toastStore";

const TOGGLEABLE_FLAGS: Array<{ flag: string; label: string }> = [
    { flag: "i", label: "Ignore case (i)" },
    { flag: "m", label: "Multiline (m)" },
    { flag: "s", label: "Dot all (s)" },
];

export default function RegexOutput() {
    const { pattern, isValid, error } = useRegexMatcher();
    const flags = useRegexStore((s) => s.flags);
    const toggleFlag = useRegexStore((s) => s.toggleFlag);

    const handleCopy = () => {
        navigator.clipboard?.writeText(`/${pattern}/${flags}`);
        toast({
            title: "Copied to clipboard",
            description: `/${pattern}/${flags}`,
            variant: "success",
        });
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Generated regex
                </h3>
                <Button
                    variant="ghost"
                    size="xs"
                    icon={<Copy className="w-3 h-3" />}
                    onClick={handleCopy}
                    disabled={pattern === ""}
                >
                    Copy
                </Button>
            </div>

            <Textarea
                mono
                value={pattern}
                readOnly
                rows={3}
                invalid={!isValid}
                className="bg-surface-raised"
            />

            <Badge
                variant={isValid ? "success" : "danger"}
                className="self-start"
            >
                {isValid ? (
                    <CheckCircle2 className="w-3 h-3" />
                ) : (
                    <XCircle className="w-3 h-3" />
                )}
                {isValid ? "Pattern is valid" : `Invalid: ${error}`}
            </Badge>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Flags
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {TOGGLEABLE_FLAGS.map(({ flag, label }) => (
                        <label
                            key={flag}
                            className={[
                                "flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 cursor-pointer border transition-colors duration-[var(--duration-fast)]",
                                flags.includes(flag)
                                    ? "bg-accent-500/15 border-accent-500/40 text-accent-300"
                                    : "bg-surface-raised border-border-default text-text-secondary hover:border-border-strong",
                            ].join(" ")}
                        >
                            <input
                                type="checkbox"
                                checked={flags.includes(flag)}
                                onChange={() => toggleFlag(flag)}
                                className="rounded border-border-strong bg-surface-raised accent-accent-500"
                            />
                            {label}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
