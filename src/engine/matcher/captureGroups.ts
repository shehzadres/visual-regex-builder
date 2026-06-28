import type { CaptureGroupResult } from "../../types/match";

/**
 * Builds CaptureGroupResult entries for every capture group in a match,
 * using the match's `indices` (from the "d" flag) when available to
 * compute precise start/end offsets, and falling back to a best-effort
 * search within the full match when indices are unavailable.
 */
export function extractCaptureGroups(
    match: RegExpMatchArray
): CaptureGroupResult[] {
    const groups: CaptureGroupResult[] = [];
    const namedGroups = match.groups ?? {};
    const namedValues = Object.entries(namedGroups);

    // match[0] is the full match; group captures start at index 1.
    const groupCount = match.length - 1;

    // matchAll with the "d" flag exposes `indices`, an array mirroring
    // `match` with [start, end] tuples per group (or undefined if the
    // group didn't participate in the match).
    const indices = (match as RegExpMatchArray & {
        indices?: Array<[number, number] | undefined>;
    }).indices;

    for (let groupIndex = 1; groupIndex <= groupCount; groupIndex++) {
        const value = match[groupIndex];
        const pos = indices?.[groupIndex];

        const matchingNamed = namedValues.find(
            ([, namedValue]) => namedValue === value && value !== undefined
        );

        groups.push({
            groupIndex,
            name: matchingNamed?.[0],
            value,
            start: pos?.[0],
            end: pos?.[1],
        });
    }

    return groups;
}
