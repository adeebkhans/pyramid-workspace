type ClassInput = string | false | null | undefined;

/**
 * Joins conditional class names. Small enough not to warrant a dependency, and
 * keeps `className={...}` expressions readable when three modifiers stack up.
 */
export function cx(...inputs: ClassInput[]): string {
  return inputs.filter(Boolean).join(' ');
}
