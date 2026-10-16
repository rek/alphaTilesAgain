import { boot, callTool, doorPath, expect, test, type Door } from '../agentTools';

type GameState = { tiles: { label: string }[]; door: Door | null };
type Answer = { correct: boolean; before: { trackerCount: number }; after: { trackerCount: number } };

const doorOf = async (page: Parameters<typeof callTool>[0], classKey: string) => {
  const { doors } = await callTool<{ doors: Door[] }>(page, 'at_doors', { classKey });
  const door = doors[0];
  if (!door) throw new Error(`no door for ${classKey}`);
  return door;
};

// #57: play a few game classes. A wrong answer is as valid as a right one, so
// try tiles in turn until one counts: the proof is the door's tracker rising.
test('Thailand: some tile counts and raises the tracker', async ({ page }) => {
  await boot(page);
  await callTool(page, 'at_players', { action: 'create', name: 'Play' });
  const door = await doorOf(page, 'thailand');
  await callTool(page, 'at_navigate', { href: doorPath(door) });

  await expect
    .poll(async () => (await callTool<GameState>(page, 'at_game_state')).tiles.length)
    .toBeGreaterThan(0);
  let counted = false;
  for (let i = 0; i < 4 && !counted; i++) {
    const answer = await callTool<Answer>(page, 'at_game_answer', { index: i });
    counted = answer.correct;
  }
  expect(counted).toBe(true);
  expect((await callTool<GameState>(page, 'at_game_state')).door?.trackerCount).toBeGreaterThan(0);
});

// #57: Thailand / Iraq / Sudan / Italy play audio. The probe counts pack clips
// handed to the player pool, which is "the app tried to play", not "you heard it".
for (const classKey of ['thailand', 'iraq', 'sudan', 'italy']) {
  test(`${classKey}: opening the door plays pack audio`, async ({ page }) => {
    await boot(page);
    await callTool(page, 'at_players', { action: 'create', name: 'Audio' });
    const door = await doorOf(page, classKey);
    await callTool(page, 'at_navigate', { href: doorPath(door) });
    // Some classes speak on mount, others on the first press (no-right/wrong
    // boards): press a tile once the board is up.
    await expect
      .poll(async () => (await callTool<GameState>(page, 'at_game_state')).tiles.length)
      .toBeGreaterThan(0);
    await callTool(page, 'at_game_answer', { index: 0 });
    await expect
      .poll(async () => (await callTool<{ clipsPlayed: number }>(page, 'at_audio_state')).clipsPlayed)
      .toBeGreaterThan(0);
  });
}
