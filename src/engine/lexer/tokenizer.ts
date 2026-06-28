import { TokenizerError, type Token } from "./tokenTypes";

const ESCAPED_CLASS_LETTERS = new Set(["d", "D", "w", "W", "s", "S"]);

/**
 * Converts a regex pattern string into a flat array of tokens, ending with
 * an EOF token. Never throws on a structurally-incomplete pattern in a way
 * that crashes the caller — it throws a typed TokenizerError that callers
 * (the parser, and ultimately the sync hook) catch and surface as a
 * friendly error instead of letting it propagate as a runtime exception.
 */
export function tokenize(pattern: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < pattern.length) {
        const ch = pattern[i];

        if (ch === "|") {
            tokens.push({ type: "PIPE", raw: "|", position: i });
            i += 1;
            continue;
        }

        if (ch === "(") {
            // Look ahead for (?: or (?<name>
            if (pattern[i + 1] === "?" && pattern[i + 2] === ":") {
                tokens.push({
                    type: "GROUP_NONCAPTURING_START",
                    raw: "(?:",
                    position: i,
                });
                i += 3;
                continue;
            }

            if (pattern[i + 1] === "?" && pattern[i + 2] === "<") {
                const nameEnd = pattern.indexOf(">", i + 3);
                if (nameEnd === -1) {
                    throw new TokenizerError(
                        "Unterminated named group: expected '>' after '(?<name'",
                        i
                    );
                }
                const name = pattern.slice(i + 3, nameEnd);
                if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
                    throw new TokenizerError(
                        `Invalid group name '${name}'`,
                        i
                    );
                }
                tokens.push({
                    type: "GROUP_NAMED_START",
                    raw: pattern.slice(i, nameEnd + 1),
                    position: i,
                    value: name,
                });
                i = nameEnd + 1;
                continue;
            }

            tokens.push({ type: "LPAREN", raw: "(", position: i });
            i += 1;
            continue;
        }

        if (ch === ")") {
            tokens.push({ type: "RPAREN", raw: ")", position: i });
            i += 1;
            continue;
        }

        if (ch === "*") {
            tokens.push({ type: "STAR", raw: "*", position: i });
            i += 1;
            continue;
        }

        if (ch === "+") {
            tokens.push({ type: "PLUS", raw: "+", position: i });
            i += 1;
            continue;
        }

        if (ch === "?") {
            tokens.push({ type: "QUESTION", raw: "?", position: i });
            i += 1;
            continue;
        }

        if (ch === ".") {
            tokens.push({ type: "DOT", raw: ".", position: i });
            i += 1;
            continue;
        }

        if (ch === "{") {
            const parsed = tryParseQuantifierRange(pattern, i);
            if (parsed) {
                tokens.push(parsed.token);
                i = parsed.nextIndex;
                continue;
            }
            // Not a valid {n,m} construct — treat '{' as a literal character,
            // matching how most regex engines handle a stray brace.
            tokens.push({ type: "CHAR", raw: "{", position: i });
            i += 1;
            continue;
        }

        if (ch === "[") {
            const parsed = parseCharClass(pattern, i);
            tokens.push(parsed.token);
            i = parsed.nextIndex;
            continue;
        }

        if (ch === "\\") {
            if (i + 1 >= pattern.length) {
                throw new TokenizerError(
                    "Pattern ends with an incomplete escape sequence '\\'",
                    i
                );
            }
            const next = pattern[i + 1];

            if (ESCAPED_CLASS_LETTERS.has(next)) {
                tokens.push({
                    type: "ESCAPED_CLASS",
                    raw: `\\${next}`,
                    position: i,
                    value: next,
                });
                i += 2;
                continue;
            }

            // Any other escaped character is treated as a literal, e.g.
            // \. \\ \( \) \[ \] \{ \} \* \+ \? \|
            tokens.push({
                type: "ESCAPED_CHAR",
                raw: `\\${next}`,
                position: i,
                value: next,
            });
            i += 2;
            continue;
        }

        // Plain literal character.
        tokens.push({ type: "CHAR", raw: ch, position: i });
        i += 1;
    }

    tokens.push({ type: "EOF", raw: "", position: pattern.length });
    return tokens;
}

/**
 * Attempts to parse a counted quantifier like {3}, {2,}, or {2,5} starting
 * at index `start` (which must point at '{'). Returns null if the text at
 * this position isn't a well-formed quantifier, so the caller can fall
 * back to treating '{' as a literal.
 */
function tryParseQuantifierRange(
    pattern: string,
    start: number
): { token: Token; nextIndex: number } | null {
    const closeIndex = pattern.indexOf("}", start);
    if (closeIndex === -1) return null;

    const body = pattern.slice(start + 1, closeIndex);
    const match = /^(\d+)(,(\d*))?$/.exec(body);
    if (!match) return null;

    const min = Number(match[1]);
    let max: number | null;

    if (match[2] === undefined) {
        // {n} — exact count.
        max = min;
    } else if (match[3] === "") {
        // {n,} — unbounded.
        max = null;
    } else {
        // {n,m}
        max = Number(match[3]);
    }

    return {
        token: {
            type: "QUANTIFIER_RANGE",
            raw: pattern.slice(start, closeIndex + 1),
            position: start,
            min,
            max,
        },
        nextIndex: closeIndex + 1,
    };
}

/**
 * Parses a bracket character class like [a-z0-9_] or [^aeiou] starting at
 * index `start` (which must point at '['). The token's `value` field holds
 * a JSON-encoded description of the class body so downstream consumers
 * (the AST builder) don't need to re-parse the raw text.
 */
function parseCharClass(
    pattern: string,
    start: number
): { token: Token; nextIndex: number } {
    let i = start + 1;
    let negated = false;

    if (pattern[i] === "^") {
        negated = true;
        i += 1;
    }

    const bodyStart = i;
    let closeIndex = -1;

    // A ']' immediately after the opening (or after '^') is a literal ']',
    // matching common regex-engine conventions.
    let scanFrom = i;
    if (pattern[scanFrom] === "]") {
        scanFrom += 1;
    }

    for (let j = scanFrom; j < pattern.length; j++) {
        if (pattern[j] === "\\") {
            j += 1; // skip escaped character inside the class
            continue;
        }
        if (pattern[j] === "]") {
            closeIndex = j;
            break;
        }
    }

    if (closeIndex === -1) {
        throw new TokenizerError(
            "Unterminated character class: expected ']'",
            start
        );
    }

    const body = pattern.slice(bodyStart, closeIndex);

    return {
        token: {
            type: "CHAR_CLASS",
            raw: pattern.slice(start, closeIndex + 1),
            position: start,
            value: JSON.stringify({ negated, body }),
        },
        nextIndex: closeIndex + 1,
    };
}
