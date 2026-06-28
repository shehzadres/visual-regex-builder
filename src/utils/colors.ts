/**
 * A palette of visually distinct colors used to color-code capture groups
 * and matches, tuned for the dark IDE-style surface. Chosen to remain
 * legible against dark backgrounds and to be distinguishable from each
 * other even for common forms of color vision deficiency (alternating
 * warm/cool hues, varied lightness). Mirrors the --color-group-* tokens
 * defined in index.css so the design system and the runtime palette never
 * drift apart.
 */
const GROUP_COLOR_PALETTE = [
    { bg: "#f0a35e", border: "#c97d35", label: "amber" },
    { bg: "#6fc7ef", border: "#3a9fcc", label: "blue" },
    { bg: "#8fd99a", border: "#56b56a", label: "green" },
    { bg: "#ef93c4", border: "#cf5fa0", label: "pink" },
    { bg: "#c3a6f7", border: "#9670e0", label: "violet" },
    { bg: "#f2cd6b", border: "#cda33a", label: "orange" },
    { bg: "#7ad9d0", border: "#3fb3a8", label: "cyan" },
    { bg: "#f08a8a", border: "#d3555a", label: "red" },
];

export interface GroupColor {
    bg: string;
    border: string;
    label: string;
}

/**
 * Returns a stable color for a given capture group index (1-based),
 * cycling through the palette for patterns with more groups than colors.
 */
export function getGroupColor(groupIndex: number): GroupColor {
    const safeIndex = Math.max(0, groupIndex - 1);
    return GROUP_COLOR_PALETTE[safeIndex % GROUP_COLOR_PALETTE.length];
}

/** The single highlight color used for the overall match span. */
export const MATCH_HIGHLIGHT_COLOR: GroupColor = {
    bg: "#efb446",
    border: "#d2932a",
    label: "match",
};
