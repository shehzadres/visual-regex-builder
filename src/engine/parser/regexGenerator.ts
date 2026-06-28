import type { QuantifierConfig, RegexBlock } from "../../types/regex";
import { escapeLiteral } from "./escape";

function parseQuantifierConfig(value: string | undefined): QuantifierConfig {
    if (!value) {
        return { kind: "+" };
    }

    try {
        const parsed = JSON.parse(value) as QuantifierConfig;
        if (parsed && typeof parsed === "object" && "kind" in parsed) {
            return parsed;
        }
    } catch {
        // Not JSON — treat the raw value as a shorthand symbol like "*", "+", "?".
    }

    if (value === "*" || value === "+" || value === "?") {
        return { kind: value };
    }

    return { kind: "+" };
}

function buildQuantifierSuffix(value: string | undefined): string {
    const config = parseQuantifierConfig(value);

    switch (config.kind) {
        case "*":
            return "*";
        case "+":
            return "+";
        case "?":
            return "?";
        case "exact":
            return `{${config.min ?? 1}}`;
        case "range": {
            const min = config.min ?? 0;
            if (config.max === undefined) {
                return `{${min},}`;
            }
            return `{${min},${config.max}}`;
        }
        default:
            return "+";
    }
}

function buildGroupPattern(block: RegexBlock): string {
    const inner = block.value ?? "";

    if (block.groupName) {
        return `(?<${block.groupName}>${inner})`;
    }

    if (block.capturing === false) {
        return `(?:${inner})`;
    }

    return `(${inner})`;
}

/**
 * Converts a single block into its corresponding regex fragment.
 * Quantifier blocks are handled specially in generateRegex because they
 * modify the fragment immediately preceding them rather than producing
 * an independent fragment.
 */
function blockToFragment(block: RegexBlock): string {
    switch (block.type) {
        case "literal":
            return escapeLiteral(block.value ?? "");

        case "digit":
            return "\\d";

        case "word":
            return "\\w";

        case "whitespace":
            return "\\s";

        case "group":
            return buildGroupPattern(block);

        case "quantifier":
            // Standalone quantifier with nothing preceding it has no valid
            // target; render nothing rather than producing a broken pattern.
            return "";

        default:
            return "";
    }
}

/**
 * Builds a full regex pattern string from an ordered list of builder blocks.
 * A "quantifier" block applies to the fragment generated immediately before it.
 */
export function generateRegex(blocks: RegexBlock[]): string {
    const fragments: string[] = [];

    for (const block of blocks) {
        if (block.type === "quantifier") {
            if (fragments.length === 0) {
                continue;
            }
            const lastIndex = fragments.length - 1;
            fragments[lastIndex] = fragments[lastIndex] + buildQuantifierSuffix(block.value);
            continue;
        }

        fragments.push(blockToFragment(block));
    }

    return fragments.join("");
}
