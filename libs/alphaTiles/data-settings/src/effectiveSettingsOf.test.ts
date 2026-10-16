import * as fs from 'fs';
import * as path from 'path';
import { parseSettings } from '@shared/util-lang-pack-parser';
import { effectiveSettingsOf } from './effectiveSettingsOf';

const LANGUAGES = path.resolve(__dirname, '../../../../languages');

function packSettings(code: string) {
  return parseSettings(fs.readFileSync(path.join(LANGUAGES, code, 'aa_settings.txt'), 'utf8'));
}

function settingsFrom(rows: Record<string, string>) {
  const body = Object.entries(rows).map(([k, v]) => `${k}\t${v}`).join('\n');
  return parseSettings(`Setting\tValue\n${body}`);
}

describe('effectiveSettingsOf', () => {
  it('yue: pack values typed, game names on by default', () => {
    expect(effectiveSettingsOf({ settings: packSettings('yue') })).toEqual({
      showGameNames: true,
      changeArrowColors: false,
      hasTileAudio: true,
      hasSyllableAudio: true,
      hidePrivacyPolicy: false,
      afterTwelveCheckedTrackers: 1,
      numberOfAvatars: 12,
      fontScale: 1,
    });
  });

  it('empty settings → built-in defaults', () => {
    expect(effectiveSettingsOf({ settings: settingsFrom({}) })).toMatchObject({
      showGameNames: true,
      afterTwelveCheckedTrackers: 3,
      numberOfAvatars: 12,
    });
  });

  it('reads numbered labels ("3. After 12 checked trackers")', () => {
    const settings = settingsFrom({ '3. After 12 checked trackers': '2', '12. Change arrow colors': 'TRUE' });
    expect(effectiveSettingsOf({ settings })).toMatchObject({
      afterTwelveCheckedTrackers: 2,
      changeArrowColors: true,
    });
  });

  describe('fontScale ("Font Scale")', () => {
    it.each([
      ['absent', {}, 1],
      ['1.3', { 'Font Scale': '1.3' }, 1.3],
      ['numbered label', { '40. Font Scale': '1.2' }, 1.2],
      ['non-numeric', { 'Font Scale': 'banana' }, 1],
      ['blank', { 'Font Scale': '' }, 1],
      ['too big clamps', { 'Font Scale': '10' }, 2.5],
      ['too small clamps', { 'Font Scale': '0.1' }, 0.5],
    ])('%s', (_name, rows: Record<string, string>, expected) => {
      expect(effectiveSettingsOf({ settings: settingsFrom(rows) }).fontScale).toBe(expected);
    });
  });

  describe('showGameNames: player preference over pack default', () => {
    const packOn = settingsFrom({ 'Show game names': 'TRUE' });
    const packOff = settingsFrom({ 'Show game names': 'FALSE' });

    it.each([
      ['pack on, unset', packOn, {}, true],
      ['pack off, unset', packOff, {}, false],
      ['pack on, player off', packOn, { showGameNames: false }, false],
      ['pack off, player on', packOff, { showGameNames: true }, true],
    ])('%s', (_name, settings, preferences, expected) => {
      expect(effectiveSettingsOf({ settings, preferences }).showGameNames).toBe(expected);
    });
  });
});
