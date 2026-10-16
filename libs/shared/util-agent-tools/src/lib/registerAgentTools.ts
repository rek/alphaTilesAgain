import type { AgentTool } from './defineAgentTool';

// WebMCP is a Chrome origin trial, absent from TS's DOM lib.
type ModelContext = {
  registerTool: (tool: AgentTool, options: { signal: AbortSignal }) => void;
};

const browserModelContext = (): ModelContext | undefined =>
  (globalThis.document as (Document & { modelContext?: ModelContext }) | undefined)
    ?.modelContext;

/**
 * Publishes tools on `document.modelContext` (WebMCP) so an agent driving a
 * local dev server reads state and acts by name instead of clicking. No-ops
 * when the browser lacks WebMCP. Callers gate on `__DEV__` so production never
 * bundles their tools. Returns an unregister function.
 */
export const registerAgentTools = (
  tools: AgentTool[],
  modelContext: ModelContext | undefined = browserModelContext(),
) => {
  if (!modelContext) return () => undefined;
  const controller = new AbortController();
  for (const tool of tools) {
    modelContext.registerTool(tool, { signal: controller.signal });
  }
  return () => controller.abort();
};
