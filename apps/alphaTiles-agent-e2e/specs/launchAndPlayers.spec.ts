import { boot, callTool, expect, test, type Door } from '../agentTools';

// #57: launch; player data persists across restarts (here: a page reload, which
// rehydrates the persisted stores from storage the same way a relaunch does).
test('boots past the audio gate, creates a player, keeps it after reload', async ({ page }) => {
  await boot(page);
  const audio = await callTool<{ audioUnlocked: boolean }>(page, 'at_audio_state');
  expect(audio.audioUnlocked).toBe(true);

  const created = await callTool<{ activePlayerId: string; players: { name: string }[] }>(page, 'at_players', {
    action: 'create',
    name: 'Agent',
  });
  expect(created.players.map((p) => p.name)).toContain('Agent');

  const { count } = await callTool<{ count: number; doors: Door[] }>(page, 'at_doors');
  expect(count).toBe(28);

  await boot(page);
  const after = await callTool<{ players: { name: string }[] }>(page, 'at_players');
  expect(after.players.map((p) => p.name)).toContain('Agent');
});
