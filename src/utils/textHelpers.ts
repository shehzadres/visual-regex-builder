/**
 * Renders whitespace-significant characters as visible placeholders so
 * zero-width or invisible matches (e.g. spaces, tabs) remain perceivable
 * in the highlighted output without altering the underlying text content
 * used for actual matching.
 */
export function describeWhitespace(text: string): string {
    if (text === "") return "";
    if (/^\s+$/.test(text)) {
        return text.replace(/ /g, "·").replace(/\t/g, "→").replace(/\n/g, "↵");
    }
    return text;
}

/** Truncates long values for compact display (e.g. in capture group chips). */
export function truncate(value: string, maxLength = 40): string {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1)}…`;
}

/** Formats a millisecond duration for display, choosing sensible precision. */
export function formatDuration(ms: number): string {
    if (ms < 1) {
        return `${(ms * 1000).toFixed(0)}µs`;
    }
    if (ms < 10) {
        return `${ms.toFixed(2)}ms`;
    }
    return `${ms.toFixed(1)}ms`;
}
