/**
 * A single member of a character class body, after parsing the bracket
 * expression's raw text: either a single character or an a-b range.
 */
export type CharClassMember =
    | { kind: "char"; value: string }
    | { kind: "range"; from: string; to: string }
    | { kind: "escapedClass"; letter: string };

export interface CharClassNode {
    type: "CharClass";
    negated: boolean;
    members: CharClassMember[];
}

export interface LiteralNode {
    type: "Literal";
    /** The single character this node matches. */
    value: string;
}

/** \d \D \w \W \s \S */
export interface EscapedClassNode {
    type: "EscapedClass";
    letter: string;
}

/** The '.' wildcard. */
export interface AnyCharNode {
    type: "AnyChar";
}

export interface ConcatNode {
    type: "Concat";
    children: ASTNode[];
}

export interface AlternationNode {
    type: "Alternation";
    options: ASTNode[];
}

export interface GroupNode {
    type: "Group";
    child: ASTNode;
    capturing: boolean;
    /** 1-based capture index, only set when capturing is true. */
    groupIndex?: number;
    /** Name for a named capture group, e.g. (?<year>...). */
    name?: string;
}

export type QuantifierKind = "*" | "+" | "?" | "range";

export interface QuantifierNode {
    type: "Quantifier";
    child: ASTNode;
    kind: QuantifierKind;
    min: number;
    /** null means unbounded (e.g. {2,} or the implicit max for '*'/'+'). */
    max: number | null;
}

export interface EmptyNode {
    /** Matches the empty string; produced for empty groups or alternation branches. */
    type: "Empty";
}

export type ASTNode =
    | LiteralNode
    | EscapedClassNode
    | AnyCharNode
    | CharClassNode
    | ConcatNode
    | AlternationNode
    | GroupNode
    | QuantifierNode
    | EmptyNode;

export class ParseError extends Error {
    position: number;

    constructor(message: string, position: number) {
        super(message);
        this.name = "ParseError";
        this.position = position;
    }
}
