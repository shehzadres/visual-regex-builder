import { CheckCircle2, AlertOctagon, AlertTriangle } from "lucide-react";
import type { BacktrackWarning } from "../../engine/benchmark/benchmarkTypes";

interface BacktrackWarningBannerProps {
    warning: BacktrackWarning;
}

export default function BacktrackWarningBanner({
    warning,
}: BacktrackWarningBannerProps) {
    if (warning.riskLevel === "none") {
        return (
            <div className="flex items-center gap-2 rounded-md border border-success-600/30 bg-success-bg px-3 py-2 text-xs text-success-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                No catastrophic backtracking risk detected for this pattern.
            </div>
        );
    }

    const isHigh = warning.riskLevel === "high";

    return (
        <div
            className={`flex flex-col gap-1.5 rounded-md border px-3 py-2.5 text-xs ${
                isHigh
                    ? "border-danger-600/30 bg-danger-bg text-danger-300"
                    : "border-warning-600/30 bg-warning-bg text-warning-300"
            }`}
        >
            <div className="flex items-center gap-2 font-semibold">
                {isHigh ? (
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                )}
                {isHigh
                    ? "High risk of catastrophic backtracking"
                    : "Potential backtracking risk"}
            </div>
            <ul className="list-disc list-inside space-y-0.5 marker:text-current/60">
                {warning.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                ))}
            </ul>
        </div>
    );
}
