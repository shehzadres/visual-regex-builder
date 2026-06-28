import { tokenize } from "../lexer/tokenizer";
import { TokenizerError, type Token } from "../lexer/tokenTypes";
import {
    ParseError,
    type ASTNode,
    type CharClassMember,
    type CharClassNode,
} from "./astTypes";

/**
 * Recursive descent parser implementing the grammar:
 *
 *   Alternation -> Concat ('|' Concat)*
 *   Concat      -> Quantified*
 *   Quantified  -> Atom Quantifier?
 *   Quantifier  -> '*' | '+' | '?' | '{n}' | '{n,}' | '{n,m}'
 *   Atom        -> CHAR | ESCAPED_CHAR | ESCAPED_CLASS | '.' | CharClass | Group
 *   Group       -> '(' Alternation ')'
 *                | '(?:' Alternation ')'
 *                | '(?<name>' Alternation ')'
 *
 * The parser never throws uncaught runtime errors for malformed input —
 * structural problems (unmatched parens, dangling quantifiers, etc.) raise
 * a typed ParseError that the caller converts into a friendly message.
 */
class Parser {
    private tokens: Token[];
    private pos = 0;
    private nextGroupIndex = 1;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): ASTNode {
        const node = this.parseAlternation();
        this.expect("EOF", "Unexpected trailing input");
        return node;
    }

    private parseAlternation(): ASTNode {
        const options: ASTNode[] = [this.parseConcat()];

        while (this.peek().type === "PIPE") {
            this.advance();
            options.push(this.parseConcat());
        }

        if (options.length === 1) {
            return options[0];
        }

        return { type: "Alternation", options };
    }

    private parseConcat(): ASTNode {
        const children: ASTNode[] = [];

        while (this.canStartAtom()) {
            children.push(this.parseQuantified());
        }

        if (children.length === 0) {
            return { type: "Empty" };
        }

        if (children.length === 1) {
            return children[0];
        }

        return { type: "Concat", children };
    }

    private canStartAtom(): boolean {
        const type = this.peek().type;
        return (
            type === "CHAR" ||
            type === "ESCAPED_CHAR" ||
            type === "ESCAPED_CLASS" ||
            type === "DOT" ||
            type === "CHAR_CLASS" ||
            type === "LPAREN" ||
            type === "GROUP_NONCAPTURING_START" ||
            type === "GROUP_NAMED_START"
        );
    }

    private parseQuantified(): ASTNode {
        const atom = this.parseAtom();
        const token = this.peek();

        if (token.type === "STAR") {
            this.advance();
            return { type: "Quantifier", child: atom, kind: "*", min: 0, max: null };
        }

        if (token.type === "PLUS") {
            this.advance();
            return { type: "Quantifier", child: atom, kind: "+", min: 1, max: null };
        }

        if (token.type === "QUESTION") {
            this.advance();
            return { type: "Quantifier", child: atom, kind: "?", min: 0, max: 1 };
        }

        if (token.type === "QUANTIFIER_RANGE") {
            this.advance();
            const min = token.min ?? 0;
            const max = token.max === undefined ? null : token.max;
            if (max !== null && max < min) {
                throw new ParseError(
                    `Quantifier range {${min},${max}} has max less than min`,
                    token.position
                );
            }
            return { type: "Quantifier", child: atom, kind: "range", min, max };
        }

        return atom;
    }

    private parseAtom(): ASTNode {
        const token = this.peek();

        switch (token.type) {
            case "CHAR":
                this.advance();
                return { type: "Literal", value: token.raw };

            case "ESCAPED_CHAR":
                this.advance();
                return { type: "Literal", value: token.value ?? token.raw };

            case "ESCAPED_CLASS":
                this.advance();
                return { type: "EscapedClass", letter: token.value ?? "" };

            case "DOT":
                this.advance();
                return { type: "AnyChar" };

            case "CHAR_CLASS":
                this.advance();
                return this.buildCharClassNode(token);

            case "LPAREN": {
                this.advance();
                const child = this.parseAlternation();
                this.expect("RPAREN", "Unclosed group: expected ')'");
                const groupIndex = this.nextGroupIndex;
                this.nextGroupIndex += 1;
                return { type: "Group", child, capturing: true, groupIndex };
            }

            case "GROUP_NONCAPTURING_START": {
                this.advance();
                const child = this.parseAlternation();
                this.expect("RPAREN", "Unclosed group: expected ')'");
                return { type: "Group", child, capturing: false };
            }

            case "GROUP_NAMED_START": {
                const name = token.value ?? "";
                this.advance();
                const child = this.parseAlternation();
                this.expect("RPAREN", "Unclosed group: expected ')'");
                const groupIndex = this.nextGroupIndex;
                this.nextGroupIndex += 1;
                return {
                    type: "Group",
                    child,
                    capturing: true,
                    groupIndex,
                    name,
                };
            }

            default:
                throw new ParseError(
                    `Unexpected token '${token.raw || token.type}'`,
                    token.position
                );
        }
    }

    private buildCharClassNode(token: Token): CharClassNode {
        let parsed: { negated: boolean; body: string };
        try {
            parsed = JSON.parse(token.value ?? "{}");
        } catch {
            throw new ParseError("Malformed character class", token.position);
        }

        const members: CharClassMember[] = [];
        const body = parsed.body;
        let i = 0;

        while (i < body.length) {
            if (body[i] === "\\" && i + 1 < body.length) {
                const next = body[i + 1];
                if (["d", "D", "w", "W", "s", "S"].includes(next)) {
                    members.push({ kind: "escapedClass", letter: next });
                } else {
                    members.push({ kind: "char", value: next });
                }
                i += 2;
                continue;
            }

            if (
                i + 2 < body.length &&
                body[i + 1] === "-" &&
                body[i + 2] !== undefined &&
                body[i + 2] !== "\\"
            ) {
                members.push({
                    kind: "range",
                    from: body[i],
                    to: body[i + 2],
                });
                i += 3;
                continue;
            }

            members.push({ kind: "char", value: body[i] });
            i += 1;
        }

        return { type: "CharClass", negated: parsed.negated, members };
    }

    private peek(): Token {
        return this.tokens[this.pos];
    }

    private advance(): Token {
        const token = this.tokens[this.pos];
        if (this.pos < this.tokens.length - 1) {
            this.pos += 1;
        }
        return token;
    }

    private expect(type: Token["type"], message: string): Token {
        const token = this.peek();
        if (token.type !== type) {
            throw new ParseError(message, token.position);
        }
        return this.advance();
    }
}

export interface ParseResult {
    isValid: boolean;
    error: string | null;
    errorPosition: number | null;
    ast: ASTNode | null;
}

/**
 * Tokenizes and parses a regex pattern string into an AST. Never throws:
 * tokenizer and parser errors are caught and reported through the returned
 * ParseResult so callers (the sync hook, the AST viewer) can render a
 * friendly message instead of crashing.
 */
export function parseRegex(pattern: string): ParseResult {
    if (pattern === "") {
        return { isValid: true, error: null, errorPosition: null, ast: { type: "Empty" } };
    }

    try {
        const tokens = tokenize(pattern);
        const parser = new Parser(tokens);
        const ast = parser.parse();
        return { isValid: true, error: null, errorPosition: null, ast };
    } catch (err) {
        if (err instanceof ParseError || err instanceof TokenizerError) {
            return {
                isValid: false,
                error: err.message,
                errorPosition: err.position,
                ast: null,
            };
        }
        return {
            isValid: false,
            error: err instanceof Error ? err.message : "Unknown parse error",
            errorPosition: null,
            ast: null,
        };
    }
}
