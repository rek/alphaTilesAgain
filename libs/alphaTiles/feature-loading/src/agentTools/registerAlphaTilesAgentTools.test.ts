import { agentProbe, type AgentTool } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';
import { alphaTilesAgentTools, registerAlphaTilesAgentTools } from './registerAlphaTilesAgentTools';

const door = {
  index: 1,
  classKey: 'thailand',
  variant: 'T',
  challengeLevel: 165,
  enabled: true,
  tracksProgress: true,
  visual: 'not-started' as const,
  trackerCount: 0,
  points: 0,
};

const fakeDeps = (): AgentDeps => {
  const players = [{ id: 'p1', name: 'Ann', avatarIndex: 0 }];
  let active: string | null = null;
  return {
    doors: () => [door, { ...door, index: 6, classKey: 'taiwan' }],
    activePlayerId: () => active,
    players: {
      list: () => players,
      create: ({ name, avatarIndex }) => {
        const p = { id: `p${players.length + 1}`, name, avatarIndex };
        players.push(p);
        return p;
      },
      select: (id) => {
        active = id;
      },
    },
    settings: { read: () => ({ showGameNames: true }), set: () => active !== null },
    navigate: () => undefined,
    probe: agentProbe.snapshot,
  };
};

const call = async (tools: AgentTool[], name: string, input: Record<string, unknown> = {}) => {
  const result = await tools.find((t) => t.name === name)?.execute(input);
  const isError = (result as { isError?: boolean } | undefined)?.isError === true;
  const text = result?.content[0]?.text ?? 'null';
  return { isError, body: isError ? text : JSON.parse(text) };
};

describe('alphaTilesAgentTools', () => {
  it('registers the eight at_* tools, and unregisters them', () => {
    const registered: { name: string; signal: AbortSignal }[] = [];
    const unregister = registerAlphaTilesAgentTools(fakeDeps(), {
      registerTool: (tool, { signal }) => void registered.push({ name: tool.name, signal }),
    });
    expect(registered.map((r) => r.name)).toEqual([
      'at_location',
      'at_navigate',
      'at_players',
      'at_doors',
      'at_game_state',
      'at_game_answer',
      'at_audio_state',
      'at_settings',
    ]);
    unregister();
    expect(registered.every((r) => r.signal.aborted)).toBe(true);
  });

  it('at_players creates and selects, and rejects an unknown player', async () => {
    const tools = alphaTilesAgentTools(fakeDeps());
    const created = await call(tools, 'at_players', { action: 'create', name: 'Bo' });
    expect(created.body.activePlayerId).toBe('p2');
    expect(created.body.players.map((p: { name: string }) => p.name)).toEqual(['Ann', 'Bo']);
    expect((await call(tools, 'at_players', { action: 'select', name: 'Nobody' })).isError).toBe(true);
  });

  it('at_doors filters by class', async () => {
    const tools = alphaTilesAgentTools(fakeDeps());
    const { body } = await call(tools, 'at_doors', { classKey: 'taiwan' });
    expect(body.count).toBe(1);
    expect(body.doors[0].index).toBe(6);
  });

  it('at_audio_state reports the probe', async () => {
    agentProbe.reset();
    agentProbe.audioUnlocked();
    agentProbe.clipPlayed('word:cat');
    const { body } = await call(alphaTilesAgentTools(fakeDeps()), 'at_audio_state');
    expect(body).toMatchObject({ audioUnlocked: true, clipsPlayed: 1, lastClip: { key: 'word:cat' } });
  });

  it('at_settings errors without an active player', async () => {
    const { isError } = await call(alphaTilesAgentTools(fakeDeps()), 'at_settings', { showGameNames: false });
    expect(isError).toBe(true);
  });
});
