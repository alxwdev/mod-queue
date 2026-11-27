/** The placeholder names that a message template may contain, written as `{{name}}`. */
export const TEMPLATE_PLACEHOLDERS = ['username', 'community', 'reason', 'duration'] as const;
export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];

/** Placeholder values; a placeholder without a value stays in the text as it is. */
export type TemplateVars = Partial<Record<TemplatePlaceholder, string>>;

// Anything between double braces, so that a misspelled `{{ username }}` is found as unknown.
const PLACEHOLDER = /\{\{([^{}]*)\}\}/g;

function isTemplatePlaceholder(name: string): name is TemplatePlaceholder {
  return (TEMPLATE_PLACEHOLDERS as readonly string[]).includes(name);
}

/** Fills the known placeholders of `template` from `vars`; unknown placeholders stay as they are. */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(
    PLACEHOLDER,
    (placeholder, name: string) =>
      (isTemplatePlaceholder(name) ? vars[name] : undefined) ?? placeholder,
  );
}

/** Returns the names between double braces that are not placeholders, each once. */
export function findUnknownPlaceholders(template: string): string[] {
  const names = Array.from(template.matchAll(PLACEHOLDER), (match) => match[1] ?? '');
  return [...new Set(names.filter((name) => !isTemplatePlaceholder(name)))];
}

/** The `{{duration}}` text of a ban: "1 day", "7 days", or "permanent" for `null`. */
export function formatBanDuration(days: number | null): string {
  if (days === null) return 'permanent';
  return days === 1 ? '1 day' : `${days} days`;
}
