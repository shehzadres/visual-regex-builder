/** A single contiguous slice of the test text, used for rendering highlights. */
export interface TextSegment {
    text: string;
    type: "normal" | "match";
    /** Index of the match this segment belongs to, when type === "match". */
    matchIndex?: number;
}

/** One capture group's result within a single match. */
export interface CaptureGroupResult {
    /** 1-based group index, matching JS regex group numbering. */
    groupIndex: number;
    /** Name of the group if it was a named capture group, e.g. (?<year>...). */
    name?: string;
    value: string | undefined;
    start: number | undefined;
    end: number | undefined;
}

/** One overall match produced by the regex engine, including its capture groups. */
export interface MatchResult {
    matchIndex: number;
    fullMatch: string;
    start: number;
    end: number;
    groups: CaptureGroupResult[];
}

/** Aggregate statistics about a run of the regex engine over the test text. */
export interface MatchStats {
    totalMatches: number;
    totalCaptureGroups: number;
    executionTimeMs: number;
    textLength: number;
    patternLength: number;
}

/** The full result of running the regex engine against the test text. */
export interface RegexEngineResult {
    pattern: string;
    flags: string;
    isValid: boolean;
    error: string | null;
    matches: MatchResult[];
    segments: TextSegment[];
    stats: MatchStats;
}
