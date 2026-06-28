import type { RegexBlock } from "../../types/regex";

export interface PatternLibraryEntry {
    id: string;
    name: string;
    description: string;
    blocks: Omit<RegexBlock, "id">[];
}

function block(b: Omit<RegexBlock, "id">): Omit<RegexBlock, "id"> {
    return b;
}

export const PATTERN_LIBRARY: PatternLibraryEntry[] = [
    {
        id: "digits-only",
        name: "Digits",
        description: "One or more digits",
        blocks: [
            block({ type: "digit" }),
            block({ type: "quantifier", value: "+" }),
        ],
    },
    {
        id: "word-token",
        name: "Word token",
        description: "One or more word characters",
        blocks: [
            block({ type: "word" }),
            block({ type: "quantifier", value: "+" }),
        ],
    },
    {
        id: "optional-whitespace",
        name: "Optional whitespace",
        description: "Zero or more whitespace characters",
        blocks: [
            block({ type: "whitespace" }),
            block({ type: "quantifier", value: "*" }),
        ],
    },
    {
        id: "phone-like",
        name: "Phone-like group",
        description: "A captured group of 3 digits",
        blocks: [
            block({
                type: "group",
                value: "\\d{3}",
                capturing: true,
            }),
        ],
    },
    {
        id: "named-year",
        name: "Named year group",
        description: "A named capture group for a 4-digit year",
        blocks: [
            block({
                type: "group",
                value: "\\d{4}",
                capturing: true,
                groupName: "year",
            }),
        ],
    },
];
