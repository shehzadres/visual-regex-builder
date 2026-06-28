import type { ASTNode } from "../ast/astTypes";
import { parseRegex } from "../ast/parser";
import type {
    BacktrackRiskLevel,
    BacktrackWarning,
    BenchmarkRunResult,
} from "./benchmarkTypes";

/**
 * Walks the AST looking for the classic structural triggers of
 * catastrophic backtracking in backtracking regex engines:
 *
 * 1. A quantified group whose body can itself match the empty string or
 *    overlapping substrings, nested inside another quantifier —
 *    e.g. (a+)+, (a*)*, (a|ab)*c — where the same input span can be
 *    partitioned among the repetitions in exponentially many ways.
 * 2. Alternation branches inside a repeated group that share a common
 *    prefix — e.g. (a|ab)*, (x|xy)+ — which forces the engine to retry
 *    every branch at every repetition boundary on failure.
 *
 * This mirrors the structural analysis real linting tools (e.g.
 * eslint-plugin-redos-detector, safe-regex) use, returning a risk level
 * plus human-readable reasons rather than a single boolean, since the
 * presence of these shapes is a strong but not certain signal — the
 * dynamic benchmark timing is what actually confirms it.
 */
const HIGH_RISK_REASON_PREFIXES = [
    "Nested repetition",
    "Alternation branches with overlapping prefixes",
    "A repeated group that can itself match an empty or overlapping span",
];

export function analyzePatternStructure(pattern: string): BacktrackWarning {
    const parsed = parseRegex(pattern);
    const reasons: string[] = [];

    if (!parsed.isValid || !parsed.ast) {
        return {
            patternId: "",
            pattern,
            riskLevel: "none",
            reasons: [],
        };
    }

    visit(parsed.ast, false, reasons);

    const uniqueReasons = dedupe(reasons);
    const hasHighRiskReason = uniqueReasons.some((reason) =>
        HIGH_RISK_REASON_PREFIXES.some((prefix) => reason.startsWith(prefix))
    );

    const riskLevel: BacktrackRiskLevel =
        uniqueReasons.length === 0
            ? "none"
            : hasHighRiskReason
              ? "high"
              : "low";

    return { patternId: "", pattern, riskLevel, reasons: uniqueReasons };
}

function dedupe(items: string[]): string[] {
    return Array.from(new Set(items));
}

function canMatchEmpty(node: ASTNode): boolean {
    switch (node.type) {
        case "Empty":
            return true;
        case "Literal":
        case "AnyChar":
        case "EscapedClass":
        case "CharClass":
            return false;
        case "Concat":
            return node.children.every(canMatchEmpty);
        case "Alternation":
            return node.options.some(canMatchEmpty);
        case "Group":
            return canMatchEmpty(node.child);
        case "Quantifier":
            return node.min === 0 || canMatchEmpty(node.child);
        default:
            return false;
    }
}

/** True if any two distinct alternation branches share a non-empty common prefix, which is the classic (a|ab) ambiguity shape. */
function hasOverlappingAlternation(node: ASTNode): boolean {
    if (node.type !== "Alternation") return false;

    const prefixes = node.options.map(firstLiteralPrefix);
    for (let i = 0; i < prefixes.length; i++) {
        for (let j = i + 1; j < prefixes.length; j++) {
            const a = prefixes[i];
            const b = prefixes[j];
            if (a === null || b === null) {
                // Unknown/non-literal prefix — treat conservatively as a
                // possible overlap rather than silently ignoring it.
                return true;
            }
            if (a !== "" && b !== "" && (a.startsWith(b) || b.startsWith(a))) {
                return true;
            }
        }
    }
    return false;
}

function firstLiteralPrefix(node: ASTNode): string | null {
    switch (node.type) {
        case "Literal":
            return node.value;
        case "Concat": {
            let prefix = "";
            for (const child of node.children) {
                if (child.type === "Literal") {
                    prefix += child.value;
                } else {
                    break;
                }
            }
            return prefix;
        }
        case "Empty":
            return "";
        default:
            return null;
    }
}

function visit(node: ASTNode, insideQuantifier: boolean, reasons: string[]): void {
    switch (node.type) {
        case "Quantifier": {
            const isRepeating = node.kind !== "?";
            if (isRepeating && insideQuantifier) {
                reasons.push(
                    "Nested repetition (a quantifier inside another repeated group) can force exponential backtracking on non-matching input."
                );
            }
            if (isRepeating && canMatchEmpty(node.child)) {
                reasons.push(
                    "A repeated group that can itself match an empty or overlapping span often causes catastrophic backtracking."
                );
            }
            visit(node.child, insideQuantifier || isRepeating, reasons);
            break;
        }
        case "Group":
            visit(node.child, insideQuantifier, reasons);
            break;
        case "Concat":
            for (const child of node.children) {
                visit(child, insideQuantifier, reasons);
            }
            break;
        case "Alternation":
            if (insideQuantifier && hasOverlappingAlternation(node)) {
                reasons.push(
                    "Alternation branches with overlapping prefixes inside a repeated group force repeated retries at every position."
                );
            }
            for (const option of node.options) {
                visit(option, insideQuantifier, reasons);
            }
            break;
        default:
            break;
    }
}

/**
 * Confirms (or escalates) the static structural warning using actual
 * timing data from benchmark runs: a pattern whose execution time grows
 * super-linearly as input size increases, or that hit the safety timeout
 * outright, is treated as a confirmed high risk regardless of what the
 * static analysis alone suggested.
 */
export function refineWarningWithRuntimeData(
    staticWarning: BacktrackWarning,
    runs: BenchmarkRunResult[]
): BacktrackWarning {
    const reasons = [...staticWarning.reasons];
    let riskLevel = staticWarning.riskLevel;

    const anyTimedOut = runs.some((r) => r.timedOut);
    if (anyTimedOut) {
        reasons.push(
            "Execution exceeded the safety time budget on at least one dataset — a strong runtime confirmation of catastrophic backtracking."
        );
        riskLevel = "high";
    }

    const completed = runs.filter((r) => !r.timedOut && !r.error);
    if (completed.length >= 2) {
        const sorted = [...completed].sort(
            (a, b) => a.datasetLength - b.datasetLength
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const lengthRatio = last.datasetLength / Math.max(1, first.datasetLength);
        const timeRatio =
            last.executionTimeMs / Math.max(0.001, first.executionTimeMs);

        // A genuinely linear/polynomial-bounded engine's time ratio should
        // stay roughly proportional to (or below) the length ratio raised
        // to a small power; a ratio that wildly outpaces the input growth
        // (here: more than the square of the length growth) is a strong
        // super-linear signal worth flagging even without a timeout.
        if (lengthRatio > 1 && timeRatio > lengthRatio * lengthRatio) {
            reasons.push(
                "Execution time grew much faster than input size across benchmark runs, consistent with super-linear backtracking behavior."
            );
            if (riskLevel !== "high") riskLevel = "high";
        }
    }

    return {
        patternId: staticWarning.patternId,
        pattern: staticWarning.pattern,
        riskLevel,
        reasons: dedupe(reasons),
    };
}
