import type { BenchmarkDataset, DatasetSizeLabel } from "./benchmarkTypes";

const SIZE_TARGETS: Record<DatasetSizeLabel, number> = {
    small: 200,
    medium: 2_000,
    large: 20_000,
    xlarge: 100_000,
};

const WORD_BANK = [
    "alpha",
    "bravo",
    "charlie",
    "delta",
    "echo",
    "foxtrot",
    "golf",
    "hotel",
    "india",
    "juliet",
    "kilo",
    "lima",
    "mike",
    "november",
    "oscar",
    "papa",
];

/**
 * A small seeded PRNG (mulberry32) so generated datasets are
 * deterministic across runs for the same size — useful for reproducible
 * benchmark comparisons rather than re-rolling random noise every time.
 */
function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Generates a realistic-ish "log-line-like" text dataset: words, digits,
 * punctuation, emails, dates, and whitespace mixed together so a wide
 * variety of regex patterns (word boundaries, digits, alternation,
 * groups) have something meaningful to match against, repeated/extended
 * until it reaches roughly `targetLength` characters.
 */
function generateRealisticText(targetLength: number, seed: number): string {
    const random = mulberry32(seed);
    const parts: string[] = [];
    let length = 0;

    function pick<T>(arr: T[]): T {
        return arr[Math.floor(random() * arr.length)];
    }

    while (length < targetLength) {
        const choice = random();
        let fragment: string;

        if (choice < 0.35) {
            fragment = pick(WORD_BANK);
        } else if (choice < 0.5) {
            fragment = String(Math.floor(random() * 100000));
        } else if (choice < 0.6) {
            fragment = `${pick(WORD_BANK)}.${pick(WORD_BANK)}@${pick(WORD_BANK)}.com`;
        } else if (choice < 0.7) {
            const y = 2000 + Math.floor(random() * 25);
            const m = String(1 + Math.floor(random() * 12)).padStart(2, "0");
            const d = String(1 + Math.floor(random() * 28)).padStart(2, "0");
            fragment = `${y}-${m}-${d}`;
        } else if (choice < 0.8) {
            fragment = pick([",", ".", "!", "?", ";", ":"]);
        } else if (choice < 0.9) {
            fragment = pick(["  ", " ", "\t"]);
        } else {
            fragment = pick(WORD_BANK).toUpperCase();
        }

        parts.push(fragment);
        parts.push(" ");
        length += fragment.length + 1;
    }

    return parts.join("").slice(0, targetLength);
}

/**
 * Generates an "adversarial" text variant biased toward repeated runs of
 * a single character, which is the classic structure that triggers
 * exponential backtracking in nested-quantifier patterns like (a+)+b —
 * a long run of 'a's followed by a single non-matching character forces
 * the engine to backtrack through every possible split of the run before
 * concluding there's no match.
 */
function generateAdversarialText(targetLength: number, fillChar = "a"): string {
    return fillChar.repeat(Math.max(0, targetLength - 1)) + "!";
}

export function generateDataset(
    sizeLabel: DatasetSizeLabel,
    variant: "realistic" | "adversarial" = "realistic",
    seed = 42
): BenchmarkDataset {
    const targetLength = SIZE_TARGETS[sizeLabel];
    const text =
        variant === "adversarial"
            ? generateAdversarialText(targetLength)
            : generateRealisticText(targetLength, seed);

    return { sizeLabel, targetLength, text };
}

export function generateAllDatasets(
    sizes: DatasetSizeLabel[],
    variant: "realistic" | "adversarial" = "realistic"
): BenchmarkDataset[] {
    return sizes.map((size) => generateDataset(size, variant));
}

export const ALL_SIZE_LABELS: DatasetSizeLabel[] = [
    "small",
    "medium",
    "large",
    "xlarge",
];

export function sizeLabelToTargetLength(size: DatasetSizeLabel): number {
    return SIZE_TARGETS[size];
}
