export type BlockType =
    | "literal"
    | "digit"
    | "word"
    | "whitespace"
    | "group"
    | "quantifier";

export interface QuantifierConfig {
    kind: "*" | "+" | "?" | "exact" | "range";
    min?: number;
    max?: number;
}

export interface RegexBlock {
    id: string;
    type: BlockType;
    /**
     * Raw value for the block. Meaning depends on type:
     * - literal: the literal text to match (escaped automatically on generation)
     * - group: the inner pattern content of the group
     * - quantifier: a serialized QuantifierConfig (JSON string) or shorthand symbol
     * - digit / word / whitespace: unused
     */
    value?: string;
    /** Whether a group is capturing (default true), non-capturing, or named. */
    groupName?: string;
    capturing?: boolean;
}

export interface ToolboxBlockDefinition {
    type: BlockType;
    label: string;
    description: string;
    defaultValue?: string;
}
