/** RFC 2606 reserved domains — placeholder contacts, never shown. */
const PLACEHOLDER_EMAIL = /@(example\.(com|org|net)|.*\.example)$/i;

/**
 * The pack's real contact address, or undefined when absent / "none" /
 * a reserved-domain placeholder (e.g. `yue@example.com`). The one place that
 * decides whether a pack Email is usable (About link, feedback entry).
 */
export function contactEmailOf({ email }: { email: string | undefined }) {
  const trimmed = email?.trim();
  if (trimmed === undefined || trimmed === '' || trimmed.toLowerCase() === 'none') {
    return undefined;
  }
  return PLACEHOLDER_EMAIL.test(trimmed) ? undefined : trimmed;
}
