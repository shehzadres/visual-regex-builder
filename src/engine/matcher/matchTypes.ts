/** Options controlling how the matcher runs a pattern against text. */
export interface MatchOptions {
    /** Additional regex flags beyond the mandatory global "g" flag, e.g. "i", "m". */
    flags?: string;
}

/** Raw result of attempting to compile and run a pattern, before shaping into MatchResult[]. */
export interface RawMatchOutcome {
    isValid: boolean;
    error: string | null;
    rawMatches: RegExpMatchArray[];
    executionTimeMs: number;
}
