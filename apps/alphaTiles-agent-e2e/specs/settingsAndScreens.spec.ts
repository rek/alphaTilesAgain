import { boot, callTool, expect, test } from '../agentTools';

// #57: settings, share screen renders (web part).
test('settings round-trips and the share screen renders', async ({ page }) => {
  await boot(page);
  await callTool(page, 'at_players', { action: 'create', name: 'Settings' });

  const off = await callTool<{ showGameNames: boolean }>(page, 'at_settings', { showGameNames: false });
  expect(off.showGameNames).toBe(false);
  await expect
    .poll(async () => (await callTool<{ showGameNames: boolean }>(page, 'at_settings')).showGameNames)
    .toBe(false);

  await callTool(page, 'at_navigate', { href: '/settings' });
  expect((await callTool<{ testIDs: string[] }>(page, 'at_location')).testIDs).toContain('settings-back-button');

  await callTool(page, 'at_navigate', { href: '/share' });
  const share = await callTool<{ path: string; headings: string[] }>(page, 'at_location');
  expect(share.path).toBe('/share');
  expect(share.headings.length).toBeGreaterThan(0);
});
