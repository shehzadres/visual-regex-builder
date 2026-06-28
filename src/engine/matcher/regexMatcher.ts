import type { MatchResult, RegexEngineResult, TextSegment } from "../../types/match";
import { extractCaptureGroups } from "./captureGroups";
import type { MatchOptions } from "./matchTypes";

/**
 * Compiles and runs `pattern` against `text` using the browser's native
 * RegExp engine. Always includes the "g" flag (required for matchAll)
 * and the "d" flag (required for precise capture group offsets), plus
 * any additional flags requested. Never throws: invalid patterns are
 * reported through the returned `isValid`/`error` fields.
 */
export function runRegexMatch(
    pattern: string,
    text: string,
    options: MatchOptions = {}
): RegexEngineResult {
    const requestedFlags = options.flags ?? "";
    const flagSet = new Set(requestedFlags.split(""));
    flagSet.add("g");
    flagSet.add("d");
    const flags = Array.from(flagSet).join("");

    const stats = {
        totalMatches: 0,
        totalCaptureGroups: 0,
        executionTimeMs: 0,
        textLength: text.length,
        patternLength: pattern.length,
    };

    if (pattern === "") {
        return {
            pattern,
            flags,
            isValid: true,
            error: null,
            matches: [],
            segments: text.length > 0 ? [{ text, type: "normal" }] : [],
            stats,
        };
    }

    let compiled: RegExp;

    try {
        compiled = new RegExp(pattern, flags);
    } catch (err) {
        return {
            pattern,
            flags,
            isValid: false,
            error: err instanceof Error ? err.message : "Invalid regular expression",
            matches: [],
            segments: text.length > 0 ? [{ text, type: "normal" }] : [],
            stats,
        };
    }

    const startTime = performance.now();

    let rawMatches: RegExpMatchArray[];
    try {
        rawMatches = [...text.matchAll(compiled)];
    } catch (err) {
        return {
            pattern,
            flags,
            isValid: false,
            error: err instanceof Error ? err.message : "Regex execution failed",
            matches: [],
            segments: text.length > 0 ? [{ text, type: "normal" }] : [],
            stats,
        };
    }

    const executionTimeMs = performance.now() - startTime;

    const matches: MatchResult[] = rawMatches.map((match, matchIndex) => {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        const groups = extractCaptureGroups(match);

        return {
            matchIndex,
            fullMatch: match[0],
            start,
            end,
            groups,
        };
    });

    const segments = buildSegments(text, matches);

    const totalCaptureGroups = matches.reduce(
        (sum, m) => sum + m.groups.length,
        0
    );

    return {
        pattern,
        flags,
        isValid: true,
        error: null,
        matches,
        segments,
        stats: {
            totalMatches: matches.length,
            totalCaptureGroups,
            executionTimeMs,
            textLength: text.length,
            patternLength: pattern.length,
        },
    };
}

/**
 * Slices the original text into normal / match segments so the UI can
 * render highlights while preserving every original character exactly,
 * including whitespace and line breaks.
 */
function buildSegments(text: string, matches: MatchResult[]): TextSegment[] {
    const segments: TextSegment[] = [];
    let lastIndex = 0;

    for (const match of matches) {
        if (match.start > lastIndex) {
            segments.push({
                text: text.slice(lastIndex, match.start),
                type: "normal",
            });
        }

        // Zero-length matches (e.g. from patterns like `x*`) still get a
        // segment so they remain visible/highlightable in the output.
        segments.push({
            text: match.fullMatch,
            type: "match",
            matchIndex: match.matchIndex,
        });

        lastIndex = Math.max(match.end, match.start);
    }

    if (lastIndex < text.length) {
        segments.push({
            text: text.slice(lastIndex),
            type: "normal",
        });
    }

    return segments;
}
