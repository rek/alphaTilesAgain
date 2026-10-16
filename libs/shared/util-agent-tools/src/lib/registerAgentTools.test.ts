import { agentProbe } from './agentProbe';
import { defineAgentTool, type AgentTool } from './defineAgentTool';
import { registerAgentTools } from './registerAgentTools';

const fakeModelContext = () => {
  const registered: { tool: AgentTool; signal: AbortSignal }[] = [];
  return {
    registered,
    registerTool: (tool: AgentTool, { signal }: { signal: AbortSignal }) => {
      registered.push({ tool, signal });
    },
  };
};

const echo = defineAgentTool({
  name: 'echo',
  description: 'echo',
  inputSchema: { type: 'object' },
  readOnly: true,
  run: async (input) => {
    if (input['fail']) throw new Error('boom');
    return input;
  },
});

describe('registerAgentTools', () => {
  it('registers every tool, and unregisters them together', () => {
    const modelContext = fakeModelContext();
    const unregister = registerAgentTools([echo], modelContext);

    expect(modelContext.registered.map(({ tool }) => tool.name)).toEqual(['echo']);
    expect(modelContext.registered[0]?.tool.annotations).toEqual({ readOnlyHint: true });
    unregister();
    expect(modelContext.registered.every(({ signal }) => signal.aborted)).toBe(true);
  });

  it('is a no-op when the browser has no WebMCP', () => {
    expect(() => registerAgentTools([echo], undefined)()).not.toThrow();
  });

  it('returns output as an MCP text result, and errors as isError', async () => {
    expect(await echo.execute({ a: 1 })).toEqual({
      content: [{ type: 'text', text: '{"a":1}' }],
    });
    expect(await echo.execute({ fail: true })).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'boom' }],
    });
  });
});

describe('agentProbe', () => {
  it('records the audio unlock and the last clip', () => {
    agentProbe.reset();
    agentProbe.audioUnlocked();
    agentProbe.clipPlayed('word:cat');
    expect(agentProbe.snapshot()).toMatchObject({
      audioUnlocked: true,
      clipsPlayed: 1,
      lastClip: { key: 'word:cat' },
    });
  });
});
