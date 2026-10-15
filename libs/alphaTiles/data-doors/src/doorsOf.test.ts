/**
 * Door catalogue against the REAL yue + eng packs (languages/<code>).
 * Pack slice is built the way the manifest does: parsed aa_*.txt plus the
 * instruction clips / stroke files actually on disk.
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseColors, parseGames, parseSettings } from '@shared/util-lang-pack-parser';
import { doorsOf } from './doorsOf';
import type { DoorPack } from './doorsOf';

const LANGUAGES = path.resolve(__dirname, '../../../../languages');

function stems(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map((f) => f.replace(/\.[^.]+$/, ''));
}

function loadPack(code: string): DoorPack {
  const dir = path.join(LANGUAGES, code);
  const read = (f: string) => fs.readFileSync(path.join(dir, f), 'utf8');
  return {
    games: parseGames(read('aa_games.txt')),
    colors: parseColors(read('aa_colors.txt')),
    settings: parseSettings(read('aa_settings.txt')),
    strokes: Object.fromEntries(
      stems(path.join(dir, 'strokes')).map((ch) => [ch, { character: ch, strokes: [], medians: [] }]),
    ),
    audio: {
      instructions: Object.fromEntries(
        stems(path.join(dir, 'audio/instructions')).map((k, i) => [k, i + 1]),
      ),
    },
  };
}

/** Same pack with one aa_games.txt row appended. */
function withRow(pack: DoorPack, row: string): DoorPack {
  const header = 'Door\tCountry\tChallengeLevel\tColor\tInstructionAudio\tAudioDuration\tSyllOrTile\tStagesIncluded\tGameName';
  const extra = parseGames(`${header}\n${row}`).rows;
  return { ...pack, games: { rows: [...pack.games.rows, ...extra] } };
}

describe('doorsOf — yue', () => {
  const pack = loadPack('yue');
  const doors = doorsOf(pack);

  it('one door per aa_games row; index is the raw 1-based row position', () => {
    expect(doors).toHaveLength(pack.games.rows.length);
    doors.forEach((door, i) => expect(door.index).toBe(i + 1));
  });

  it('door 9 is Georgia in syllable mode', () => {
    const door = doors[8];
    expect(door).toMatchObject({ classKey: 'georgia', country: 'Georgia', variant: 'S', challengeLevel: 1 });
    expect(door.progressKey('p1')).toBe('Georgia1p1S1');
  });

  it('Thailand shows the hundreds digit as its level; stage "-" is 1', () => {
    const door = doors[0];
    expect(door).toMatchObject({ classKey: 'thailand', challengeLevel: 165, displayLevel: 1, stage: 1, variant: 'T' });
    expect(door.progressKey('p1')).toBe('Thailand165p11');
  });

  it('colour comes from aa_colors by the row colour number', () => {
    expect(doors[0].colorHex).toBe(pack.colors.hexByIndex[3]);
    expect(doors[5].colorHex).toBe(pack.colors.hexByIndex[0]);
  });

  it('instruction audio only when the pack bundles the clip ("X" → none)', () => {
    expect(doors[0].instructionAudio).toBe('zzz_thailand_image');
    expect(doors[5].instructionAudio).toBeUndefined(); // Taiwan, "X"
    expect(doors[22].instructionAudio).toBeUndefined(); // Brazil, "X"
  });

  it('no-right/wrong classes do not track progress', () => {
    const byClass = (k: string) => doors.find((d) => d.classKey === k);
    expect(byClass('malaysia')?.tracksProgress).toBe(false);
    expect(byClass('sudan')?.tracksProgress).toBe(false);
    expect(byClass('iraq')?.tracksProgress).toBe(false);
    expect(byClass('thailand')?.tracksProgress).toBe(true);
  });

  it('yue names are awaiting the customer: every door is unlabelled', () => {
    expect(doors.every((d) => d.name === undefined)).toBe(true);
  });

  it('Taiwan doors are enabled: yue ships stroke data', () => {
    const taiwan = doors.filter((d) => d.classKey === 'taiwan');
    expect(taiwan.map((d) => d.index)).toEqual([6, 7, 8]);
    expect(taiwan.every((d) => d.enabled)).toBe(true);
  });

  it('"Enable stroke order game = FALSE" hides Taiwan; other doors keep their index', () => {
    const settings = parseSettings('Setting\tValue\nEnable stroke order game\tFALSE');
    const hidden = doorsOf({ ...pack, settings });
    expect(hidden.filter((d) => !d.enabled).map((d) => d.index)).toEqual([6, 7, 8]);
    expect(hidden[8].classKey).toBe('georgia');
  });
});

describe('doorsOf — eng', () => {
  const pack = loadPack('eng');
  const doors = doorsOf(pack);

  it('every door is enabled and indexes match file order', () => {
    expect(doors).toHaveLength(pack.games.rows.length);
    expect(doors.every((d, i) => d.enabled && d.index === i + 1)).toBe(true);
  });

  it('multi-word class keeps its kebab route key', () => {
    const us = doors.find((d) => d.country === 'UnitedStates');
    expect(us?.classKey).toBe('united-states');
  });

  it('Romania (door 1) is no-right/wrong with bundled instructions', () => {
    expect(doors[0]).toMatchObject({ classKey: 'romania', tracksProgress: false, instructionAudio: 'zzz_romania' });
  });

  it('unbundled instruction ids resolve to none', () => {
    expect(doors[1]).toMatchObject({ classKey: 'malaysia', instructionAudio: undefined });
  });

  it('Brazil CL 4–6 display as 1–3', () => {
    const brazil = doors.filter((d) => d.classKey === 'brazil');
    expect(brazil.map((d) => [d.challengeLevel, d.displayLevel])).toContainEqual([4, 1]);
  });

  it('Taiwan is hidden without stroke data', () => {
    const extended = doorsOf(withRow(pack, '999\tTaiwan\t1\t0\tX\t0\tT\t-'));
    expect(extended[extended.length - 1]).toMatchObject({ classKey: 'taiwan', enabled: false });
  });

  it('stage flows into the progress key ("2" → …2, not …1)', () => {
    const extended = doorsOf(withRow(pack, '999\tChina\t3\t0\tzzz_china\t0\tT\t2'));
    const door = extended[extended.length - 1];
    expect(door.stage).toBe(2);
    expect(door.progressKey('player01')).toBe('China3player012');
  });

  it('GameName becomes Door.name (trimmed); empty → undefined', () => {
    const named = doorsOf(withRow(pack, '999\tChina\t1\t0\tzzz_china\t0\tT\t-\t Build words '));
    expect(named[named.length - 1].name).toBe('Build words');
    const unnamed = doorsOf(withRow(pack, '999\tChina\t1\t0\tzzz_china\t0\tT\t-'));
    expect(unnamed[unnamed.length - 1].name).toBeUndefined();
    expect(doors.every((d) => d.name === undefined)).toBe(true);
  });

  it('unknown colour number falls back to the first colour', () => {
    const extended = doorsOf(withRow(pack, '999\tChina\t1\tzz\tzzz_china\t0\tT\t-'));
    expect(extended[extended.length - 1].colorHex).toBe(pack.colors.hexByIndex[0]);
  });
});
