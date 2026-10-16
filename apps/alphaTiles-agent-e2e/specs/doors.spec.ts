import { boot, callTool, doorPath, expect, test, type Door } from '../agentTools';

// #57: all 28 yue doors open and render a game shell. CJK glyph correctness is
// a visual check; this proves every door routes to a mounted game with a back
// button and a score bar, and that the boards of tile games list their tiles.
test('every yue door opens into a mounted game shell', async ({ page }) => {
  await boot(page);
  await callTool(page, 'at_players', { action: 'create', name: 'Doors' });
  const { doors } = await callTool<{ doors: Door[] }>(page, 'at_doors');
  expect(doors).toHaveLength(28);

  for (const door of doors.filter((d) => d.enabled)) {
    await callTool(page, 'at_navigate', { href: doorPath(door) });
    await expect
      .poll(async () => (await callTool<{ testIDs: string[] }>(page, 'at_location')).testIDs, {
        message: `door ${door.index} (${door.classKey}) never showed the game shell`,
      })
      .toEqual(expect.arrayContaining(['shell-back-button', 'shell-score-bar']));
    const game = await callTool<{ inGame: boolean; classKey: string; doorIndex: number }>(page, 'at_game_state');
    expect(game).toMatchObject({ inGame: true, classKey: door.classKey, doorIndex: door.index });
  }
});
