import type {
    BenchmarkConfig,
    BenchmarkDataset,
    BenchmarkPattern,
    BenchmarkRunResult,
    BenchmarkSummary,
} from "./benchmarkTypes";
import { generateDataset, sizeLabelToTargetLength } from "./datasetGenerator";
import {
    analyzePatternStructure,
    refineWarningWithRuntimeData,
} from "./catastrophicBacktrackDetector";

type DatasetSizeLabelInternal = BenchmarkDataset["sizeLabel"];

/**
 * Hard ceiling on how long any single probe step may run before the
 * incremental search below gives up and refuses to test any larger
 * length. Probing must step by a single character at a time (see
 * findSafeAdversarialLength) rather than doubling the length, because for
 * a genuinely exponential pattern the *next* length can be catastrophically
 * slower even when the previous one was comfortably fast — measured
 * directly against (a+)+b, length 16 took 0.3ms while length 32 took over
 * 20 *seconds*. Doubling the probe length doubles (at minimum) the
 * exponent, which can blow the budget by many orders of magnitude before
 * the timing check ever gets a chance to run. Stepping by one character
 * bounds the worst-case overshoot to roughly a small constant multiple of
 * the previous step's cost instead.
 */
const PROBE_STEP_BUDGET_MS = 40;

/**
 * The realistic-dataset target lengths a structurally-risky pattern
 * would ideally be tested at, used only as an upper bound to stop the
 * search past — the actual length used per size label is whatever the
 * incremental probe below proves is safe, which is almost always far
 * smaller than these targets for genuinely catastrophic patterns.
 */
const ADVERSARIAL_UPPER_BOUNDS: Record<DatasetSizeLabelInternal, number> = {
    small: 18,
    medium: 24,
    large: 30,
    xlarge: 36,
};

/**
 * Finds the largest adversarial length, starting from a tiny seed and
 * incrementing one character at a time, for which a probe run stays
 * under PROBE_STEP_BUDGET_MS — never actually running the pattern at a
 * length it hasn't first proven safe one character below. Single-
 * character stepping (rather than doubling) is what makes this safe
 * against arbitrarily deep nested-quantifier patterns: see the comment
 * on PROBE_STEP_BUDGET_MS above for the measured justification.
 */
function findSafeAdversarialLength(
    pattern: string,
    flags: string,
    upperBound: number
): { safeLength: number; confirmedCatastrophic: boolean } {
    let lastSafeLength = 0;

    for (let length = 2; length <= upperBound; length += 1) {
        const probeText = "a".repeat(Math.max(0, length - 1)) + "!";
        const { executionTimeMs, error } = runSingle(pattern, flags, probeText);

        if (error) {
            // A compile/runtime error isn't a hang risk; let the normal
            // run path surface the error through its own result entry.
            return { safeLength: upperBound, confirmedCatastrophic: false };
        }

        if (executionTimeMs > PROBE_STEP_BUDGET_MS) {
            return {
                safeLength: lastSafeLength,
                confirmedCatastrophic: lastSafeLength < 4,
            };
        }

        lastSafeLength = length;
    }

    return { safeLength: lastSafeLength, confirmedCatastrophic: false };
}

/**
 * A single pattern's execution time is capped against this budget. Note
 * that JavaScript's RegExp.exec runs synchronously on the calling thread
 * and cannot be interrupted mid-execution from within the same call —
 * there is no true preemptive timeout available here without moving
 * execution to a Web Worker (which this benchmarking module does not do,
 * to keep results directly comparable with the rest of the app's
 * same-thread matching). Instead, `timeoutMs` is enforced *before* running
 * a pattern against a larger dataset: once a pattern has already taken
 * longer than the budget on a smaller dataset, larger sizes for that same
 * pattern are skipped and reported as timed out rather than actually
 * attempted. For patterns flagged as structurally risky, the incremental
 * single-character probe (findSafeAdversarialLength above) runs first to
 * discover a length that's actually safe to attempt, so the page itself
 * never hangs even on confirmed-catastrophic patterns.
 */
const DEFAULT_TIMEOUT_MS = 1500;

export const DEFAULT_BENCHMARK_PATTERNS: BenchmarkPattern[] = [
    { id: "word", label: "Word characters", pattern: "\\w+" },
    { id: "digits", label: "Digits", pattern: "\\d+" },
    { id: "email", label: "Email address", pattern: "[\\w.]+@[\\w.]+" },
    { id: "date", label: "ISO date", pattern: "\\d{4}-\\d{2}-\\d{2}" },
    {
        id: "alternation",
        label: "Word alternation",
        pattern: "(alpha|bravo|charlie|delta)",
    },
    {
        id: "nested-plus",
        label: "Nested quantifier (risky)",
        pattern: "(a+)+b",
    },
    {
        id: "overlapping-alt",
        label: "Overlapping alternation (risky)",
        pattern: "(a|ab)*c",
    },
];

function runSingle(
    pattern: string,
    flags: string,
    text: string
): { executionTimeMs: number; matchCount: number; error: string | null } {
    try {
        const regex = new RegExp(
            pattern,
            flags.includes("g") ? flags : `${flags}g`
        );
        const start = performance.now();
        const matches = text.match(regex);
        const executionTimeMs = performance.now() - start;
        return {
            executionTimeMs,
            matchCount: matches ? matches.length : 0,
            error: null,
        };
    } catch (err) {
        return {
            executionTimeMs: 0,
            matchCount: 0,
            error: err instanceof Error ? err.message : "Regex execution failed",
        };
    }
}

/**
 * Runs one pattern across every dataset, in increasing size order,
 * short-circuiting (and marking remaining sizes as timed out) as soon as
 * a run exceeds `timeoutMs` — this is the practical, same-thread-safe
 * stand-in for a true execution timeout described above.
 */
function runPatternAcrossDatasets(
    patternDef: BenchmarkPattern,
    datasets: BenchmarkDataset[],
    timeoutMs: number
): BenchmarkRunResult[] {
    const results: BenchmarkRunResult[] = [];
    let alreadyExceededBudget = false;

    const sorted = [...datasets].sort(
        (a, b) => a.targetLength - b.targetLength
    );

    for (const dataset of sorted) {
        if (alreadyExceededBudget) {
            results.push({
                patternId: patternDef.id,
                patternLabel: patternDef.label,
                pattern: patternDef.pattern,
                sizeLabel: dataset.sizeLabel,
                datasetLength: dataset.text.length,
                executionTimeMs: timeoutMs,
                matchCount: 0,
                timedOut: true,
                error: null,
            });
            continue;
        }

        const { executionTimeMs, matchCount, error } = runSingle(
            patternDef.pattern,
            patternDef.flags ?? "",
            dataset.text
        );

        const timedOut = executionTimeMs > timeoutMs;
        if (timedOut) {
            alreadyExceededBudget = true;
        }

        results.push({
            patternId: patternDef.id,
            patternLabel: patternDef.label,
            pattern: patternDef.pattern,
            sizeLabel: dataset.sizeLabel,
            datasetLength: dataset.text.length,
            executionTimeMs,
            matchCount,
            timedOut,
            error,
        });
    }

    return results;
}

/** Simple least-squares linear regression slope of y (time) against x (length), in ms per character. */
function computeGrowthSlope(runs: BenchmarkRunResult[]): number {
    const points = runs
        .filter((r) => !r.timedOut && !r.error)
        .map((r) => ({ x: r.datasetLength, y: r.executionTimeMs }));

    if (points.length < 2) return 0;

    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Runs every configured pattern across every configured dataset size,
 * producing a full benchmark summary per pattern: raw per-size results,
 * a combined static+runtime catastrophic-backtracking warning, and a
 * growth-rate slope for charting.
 */
export function runBenchmarkSuite(config: BenchmarkConfig): BenchmarkSummary[] {
    const datasets = config.sizes.map((size) =>
        generateDataset(size, "realistic")
    );

    return config.patterns.map((patternDef) => {
        const staticWarning = analyzePatternStructure(patternDef.pattern);
        const isStructurallyRisky = staticWarning.riskLevel === "high";

        let runs: BenchmarkRunResult[];

        if (isStructurallyRisky) {
            const maxUpperBound = Math.max(
                ...config.sizes.map((s) => ADVERSARIAL_UPPER_BOUNDS[s])
            );
            const { safeLength, confirmedCatastrophic } =
                findSafeAdversarialLength(
                    patternDef.pattern,
                    patternDef.flags ?? "",
                    maxUpperBound
                );

            if (confirmedCatastrophic || safeLength === 0) {
                // Even the smallest probes were too slow — this pattern is
                // confirmed catastrophic. Report every configured size as
                // timed out without attempting any of them.
                runs = config.sizes.map((sizeLabel) => ({
                    patternId: patternDef.id,
                    patternLabel: patternDef.label,
                    pattern: patternDef.pattern,
                    sizeLabel,
                    datasetLength: sizeLabelToTargetLength(sizeLabel),
                    executionTimeMs: config.timeoutMs,
                    matchCount: 0,
                    timedOut: true,
                    error: null,
                }));
            } else {
                // Every dataset size is capped at whichever is smaller: its
                // own upper bound, or the globally-proven-safe length —
                // every length actually attempted below has already been
                // shown safe by findSafeAdversarialLength above.
                const cappedAdversarialDatasets = config.sizes.map(
                    (size): BenchmarkDataset => {
                        const cap = Math.min(
                            ADVERSARIAL_UPPER_BOUNDS[size],
                            safeLength
                        );
                        const text = "a".repeat(Math.max(0, cap - 1)) + "!";
                        return { sizeLabel: size, targetLength: cap, text };
                    }
                );
                runs = runPatternAcrossDatasets(
                    patternDef,
                    cappedAdversarialDatasets,
                    config.timeoutMs
                );
            }
        } else {
            runs = runPatternAcrossDatasets(patternDef, datasets, config.timeoutMs);
        }

        const warning = refineWarningWithRuntimeData(
            { ...staticWarning, patternId: patternDef.id },
            runs
        );

        return {
            patternId: patternDef.id,
            patternLabel: patternDef.label,
            pattern: patternDef.pattern,
            runs,
            warning,
            growthSlopeMsPerChar: computeGrowthSlope(runs),
        };
    });
}

export function createDefaultBenchmarkConfig(
    extraPatterns: BenchmarkPattern[] = []
): BenchmarkConfig {
    return {
        patterns: [...DEFAULT_BENCHMARK_PATTERNS, ...extraPatterns],
        sizes: ["small", "medium", "large"],
        timeoutMs: DEFAULT_TIMEOUT_MS,
    };
}

export { DEFAULT_TIMEOUT_MS };
