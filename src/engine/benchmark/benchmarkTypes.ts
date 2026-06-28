export interface BenchmarkPattern {
    id: string;
    label: string;
    pattern: string;
    flags?: string;
}

export type DatasetSizeLabel = "small" | "medium" | "large" | "xlarge";

export interface BenchmarkDataset {
    sizeLabel: DatasetSizeLabel;
    /** Approximate character length of the generated input string. */
    targetLength: number;
    text: string;
}

export interface BenchmarkRunResult {
    patternId: string;
    patternLabel: string;
    pattern: string;
    sizeLabel: DatasetSizeLabel;
    datasetLength: number;
    /** Time to execute the pattern against the dataset, measured with performance.now(). */
    executionTimeMs: number;
    matchCount: number;
    /** True when the run was aborted early because it exceeded the safety time budget — a strong signal of catastrophic backtracking. */
    timedOut: boolean;
    error: string | null;
}

export type BacktrackRiskLevel = "none" | "low" | "high";

export interface BacktrackWarning {
    patternId: string;
    pattern: string;
    riskLevel: BacktrackRiskLevel;
    reasons: string[];
}

export interface BenchmarkSummary {
    patternId: string;
    patternLabel: string;
    pattern: string;
    runs: BenchmarkRunResult[];
    warning: BacktrackWarning;
    /** Simple linear-regression slope of executionTimeMs against datasetLength, in ms per character — a rough growth-rate signal alongside the static heuristic warning. */
    growthSlopeMsPerChar: number;
}

export interface BenchmarkConfig {
    patterns: BenchmarkPattern[];
    sizes: DatasetSizeLabel[];
    /** Per-run timeout in milliseconds; a run exceeding this is marked timedOut and aborted rather than left to hang the page. */
    timeoutMs: number;
}
