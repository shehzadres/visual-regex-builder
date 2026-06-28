/**
 * The kinds of tokens the tokenizer can produce from a regex pattern string.
 * This is a deliberately small, regular-language-focused token set: it
 * covers exactly what the recursive descent parser and Thompson's
 * construction need, not the full PCRE grammar.
 */
export type TokenType =
    | "CHAR" // a literal character, e.g. 'a'
    | "ESCAPED_CLASS" // \d, \w, \s, \D, \W, \S
    | "ESCAPED_CHAR" // \., \\, \(, etc. — an escaped metacharacter treated as literal
    | "CHAR_CLASS" // a bracket expression, e.g. [a-z0-9]
    | "DOT" // .
    | "PIPE" // |
    | "LPAREN" // (
    | "RPAREN" // )
    | "GROUP_NONCAPTURING_START" // (?:
    | "GROUP_NAMED_START" // (?<name>
    | "STAR" // *
    | "PLUS" // +
    | "QUESTION" // ?
    | "LBRACE" // { — start of a counted quantifier {n}, {n,}, {n,m}
    | "QUANTIFIER_RANGE" // a fully-parsed {n}, {n,}, or {n,m} token
    | "EOF";

export interface Token {
    type: TokenType;
    /** The raw source text this token was produced from. */
    raw: string;
    /** Position in the original pattern string where this token starts. */
    position: number;
    /**
     * Semantic value for tokens that carry extra data:
     * - ESCAPED_CLASS: the class letter, e.g. "d", "W"
     * - CHAR_CLASS: the bracket expression body description (negated flag + ranges), JSON-encoded
     * - GROUP_NAMED_START: the captured group name
     * - QUANTIFIER_RANGE: "{min}" | "{min,}" | "{min,max}" parsed into {min, max}
     */
    value?: string;
    min?: number;
    max?: number | null;
}

export class TokenizerError extends Error {
    position: number;

    constructor(message: string, position: number) {
        super(message);
        this.name = "TokenizerError";
        this.position = position;
    }
}
