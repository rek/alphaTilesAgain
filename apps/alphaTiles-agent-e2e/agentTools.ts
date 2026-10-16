import { test as base, expect, type Page } from '@playwright/test';

// The app's dev-only WebMCP tools (libs/alphaTiles/feature-loading/src/agentTools),
// driven headless. WebMCP is a Chrome origin trial, so instead of a flag this
// installs a `document.modelContext` before the app boots that keeps every
// registered tool in a map the test calls by name. A browser with real WebMCP
// keeps its own: the shim only fills an absence.
const installModelContextShim = () => {
  const doc = document as Document & { modelContext?: unknown };
  const tools = new Map<string, { execute: (input: object) => Promise<unknown> }>();
  (window as unknown as { __agentTools: typeof tools }).__agentTools = tools;
  if (doc.modelContext) return;
  doc.modelContext = {
    registerTool: (
      tool: { name: string; execute: (input: object) => Promise<unknown> },
      { signal }: { signal: AbortSignal },
    ) => {
      tools.set(tool.name, tool);
      signal.addEventListener('abort', () => tools.delete(tool.name));
    },
  };
};

type ToolResult = { isError?: boolean; content: { text: string }[] };

/** Calls one app tool by name; a tool's `isError` result fails the test with its message. */
export const callTool = async <T = unknown>(
  page: Page,
  name: string,
  input: Record<string, unknown> = {},
): Promise<T> => {
  await expect
    .poll(
      () =>
        page.evaluate(
          (tool) => (window as unknown as { __agentTools?: Map<string, unknown> }).__agentTools?.has(tool) ?? false,
          name,
        ),
      {
        message: `tool ${name} never registered (is this the dev server?)`,
        // The first load of a cold Metro server bundles for ~60s before any tool registers.
        timeout: 150_000,
      },
    )
    .toBe(true);
  const result = (await page.evaluate(
    ([tool, args]) =>
      (
        window as unknown as {
          __agentTools: Map<string, { execute: (input: object) => Promise<unknown> }>;
        }
      ).__agentTools
        .get(tool as string)
        ?.execute(args as object),
    [name, input] as const,
  )) as ToolResult;
  const text = result.content[0]?.text ?? '';
  if (result.isError) throw new Error(`${name}: ${text}`);
  return JSON.parse(text) as T;
};

/** Loads the app and passes the web tap-to-begin gate with a real click (audio unlock needs a gesture). */
export const boot = async (page: Page, url = '/') => {
  await page.goto(url);
  const gate = page.getByTestId('web-audio-unlock-gate');
  await gate.waitFor({ timeout: 150_000 });
  // The gate ignores presses until the preload settles.
  await expect(async () => {
    await gate.click({ timeout: 2_000 });
    await expect(gate).toBeHidden({ timeout: 2_000 });
  }).toPass({ timeout: 120_000 });
};

export type Door = {
  index: number;
  classKey: string;
  variant: string;
  challengeLevel: string | number;
  enabled: boolean;
  tracksProgress: boolean;
  visual: string;
  trackerCount: number;
  points: number;
};

export const doorPath = (d: Pick<Door, 'classKey' | 'index' | 'challengeLevel'>) =>
  `/games/${d.classKey}?doorIndex=${d.index}&challengeLevel=${d.challengeLevel}`;

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, provide) => {
    await page.addInitScript(installModelContextShim);
    await provide(page);
  },
});
export { expect };
