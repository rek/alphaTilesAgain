/**
 * Web-only DOM reads for the agent tools. react-native-web maps testID to
 * data-testid and accessibilityLabel to aria-label. Dev tooling: the one file
 * that bundles several tiny helpers.
 */
const root = (): Document => globalThis.document;

export const testIdsOnPage = (): string[] =>
  [
    ...new Set(
      Array.from(root().querySelectorAll('[data-testid]')).map((el) => el.getAttribute('data-testid') ?? ''),
    ),
  ].filter(Boolean);

export const headingsOnPage = (): string[] =>
  Array.from(root().querySelectorAll('h1,h2,h3,[role="heading"]'))
    .map((el) => (el.textContent ?? '').trim())
    .filter(Boolean);

export const elementsByTestId = (testId: string): HTMLElement[] =>
  Array.from(root().querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`));

export const labelOf = (el: HTMLElement): string =>
  el.getAttribute('aria-label') ?? (el.textContent ?? '').trim();

export const pageLocation = (): { path: string; search: string } => ({
  path: globalThis.location.pathname,
  search: globalThis.location.search,
});

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
