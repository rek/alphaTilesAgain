type AgentToolSpec = {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties?: Record<string, unknown>; required?: string[] };
  readOnly: boolean;
  /** Returns any JSON-serialisable value; thrown errors come back as an error result. */
  run: (input: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Turns a tool spec into the shape `document.modelContext.registerTool`
 * takes. Tools return plain data; this owns the MCP text-result envelope and
 * error reporting so no tool repeats them.
 */
export const defineAgentTool = ({ readOnly, run, ...spec }: AgentToolSpec) => ({
  ...spec,
  annotations: { readOnlyHint: readOnly },
  execute: async (input: Record<string, unknown> | undefined) => {
    try {
      const value = await run(input ?? {});
      return { content: [{ type: 'text', text: JSON.stringify(value) }] };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  },
});

export type AgentTool = ReturnType<typeof defineAgentTool>;
