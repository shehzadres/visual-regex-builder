/**
 * Escapes a string so it can be safely inserted into a regex pattern
 * as a literal sequence of characters.
 */
export function escapeLiteral(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
