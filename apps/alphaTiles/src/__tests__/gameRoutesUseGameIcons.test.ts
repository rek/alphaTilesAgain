import * as fs from 'fs';
import * as path from 'path';

const gamesDir = path.join(__dirname, '../../app/games');

describe('game routes', () => {
  const routes = fs
    .readdirSync(gamesDir)
    .filter((f) => f.endsWith('.tsx') && !f.startsWith('['));

  it('finds game routes', () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it.each(routes)('%s passes shared gameIcons', (file) => {
    const src = fs.readFileSync(path.join(gamesDir, file), 'utf8');
    expect(src).toContain("from '../../src/gameIcons'");
    expect(src).toContain('icons={gameIcons}');
  });
});
