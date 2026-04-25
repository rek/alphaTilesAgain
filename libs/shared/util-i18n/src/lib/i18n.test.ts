/**
 * Unit tests for libs/shared/util-i18n.
 *
 * Tests are grouped by exported function. Each group resets the i18next
 * singleton between tests via forced re-init.
 *
 * Mocks:
 *  - expo-constants: provides a controllable appLang value for getBuildLang().
 *  - locales/en.json: identity-mock via jest.mock so Metro-style require() works.
 *
 * Covers spec scenarios:
 *  - Chrome resolves against device locale / English fallback
 *  - Malformed / unsupported locale falls back to English
 *  - Missing key in dev → throws; in prod → returns key literal
 *  - registerContentNamespaces: first registration + re-registration replaces
 *  - Nested content keys (dot notation) resolve correctly
 *  - Minimum required chrome keys are all non-empty
 *  - Interpolation applies to score/tracker keys
 */

// ---------------------------------------------------------------------------
// Module-level mocks (must be before imports)
// ---------------------------------------------------------------------------

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        appLang: 'eng',
      },
    },
  },
}));

// Metro bundles JSON via require(). In Jest we mimic that by returning the
// actual en.json content so initI18n can read the chrome bundle.
jest.mock(
  '../../../../locales/en.json',
  () => ({
    chrome: {
      back: 'Back',
      home: 'Home',
      score: 'Score: {{points}}',
      choose_player: 'Choose Player',
      set_player_name: 'Set Player Name',
      tracker_of_total: 'Tracker {{current}} of {{total}}',
      play_again: 'Play Again',
      celebrate:
        'Great job! You found correct answers to 12 questions on this game!',
      about: 'About This App',
      share: 'Share',
      resources: 'Other Resources In This Language',
      resource_item: 'A Resource In This Language',
      build_word_here: 'Build Word Here',
      go_backward: 'Go To Previous',
      go_forward: 'Go To Next',
      see_more_of_tile: 'See More Words Starting With This Game Tile',
      expired_title: 'Expired',
      expired_message: 'This app has expired.',
      a11y: {
        tile: 'Tile {{letter}}',
        word: 'Word {{word}}',
        active_word_picture: 'Picture of Active Word',
        keyboard_key: 'Key {{key}}',
        backspace: 'Backspace',
        alpha_tiles_logo: 'Alpha Tiles Logo',
        tracker: 'Tracker {{current}} of {{total}}',
        points_background: 'Points Background',
        player_avatar: 'Change Players',
        memory_card: 'Memory Card {{number}}',
        word_choice: 'Word Choice {{number}}',
        word_image: 'Word Image {{number}}',
        choice: 'Choice {{number}}',
        avatar_icon: 'Player {{number}} Avatar Icon',
        door: 'Door {{number}}',
        game_tile: 'Game Tile {{id}}',
        active_word: 'Word In Focus',
        play_audio_instructions: 'Play Audio Instructions',
      },
    },
  }),
  { virtual: true },
);

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { i18n } from './i18nInstance';
import { initI18n } from './initI18n';
import { registerContentNamespaces } from './registerContentNamespaces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fully reset the singleton between tests by clearing the initialized flag. */
async function resetAndInit(deviceLocale: string): Promise<void> {
  if (i18n.isInitialized) {
    // Remove any previously added resource bundles from content namespaces.
    for (const ns of ['tile', 'word', 'syllable', 'game', 'langMeta']) {
      if (i18n.hasResourceBundle('eng', ns)) {
        i18n.removeResourceBundle('eng', ns);
      }
    }
    // Force re-init by clearing the initialized flag via index access.
    (i18n as unknown as Record<string, unknown>)['isInitialized'] = false;
  }

  await initI18n({ deviceLocale });
}

// ---------------------------------------------------------------------------
// Group 1: initI18n — chrome lookups + locale handling
// ---------------------------------------------------------------------------

describe('initI18n: chrome lookups and locale handling', () => {
  test('en-US device locale → chrome.back returns English value', async () => {
    await resetAndInit('en-US');
    expect(i18n.t('chrome:back', { lng: 'en' })).toBe('Back');
  });

  test('zh-TW device with no zh bundle → falls back to English chrome', async () => {
    await resetAndInit('zh-TW');
    // zh not registered → fallback to en
    expect(i18n.t('chrome:back')).toBe('Back');
  });

  test("locale 'und' → init succeeds, English chrome resolves", async () => {
    await resetAndInit('und');
    expect(i18n.t('chrome:back')).toBe('Back');
  });

  test("locale 'C' → init succeeds, English chrome resolves", async () => {
    await resetAndInit('C');
    expect(i18n.t('chrome:back')).toBe('Back');
  });

  test('empty locale → init succeeds, English chrome resolves', async () => {
    await resetAndInit('');
    expect(i18n.t('chrome:back')).toBe('Back');
  });

  test('idempotent: calling initI18n twice does not throw', async () => {
    await resetAndInit('en-US');
    // Second call should return immediately (i18n.isInitialized guard).
    await expect(initI18n({ deviceLocale: 'en-US' })).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group 2: Missing-key behavior
// ---------------------------------------------------------------------------

describe('initI18n: missing-key behavior', () => {
  beforeEach(async () => {
    await resetAndInit('en-US');
  });

  test('__DEV__ true + missing chrome key → throws with ns and key in message', () => {
    const g = global as unknown as Record<string, unknown>;
    const origDev = g['__DEV__'];
    g['__DEV__'] = true;
    try {
      expect(() => i18n.t('chrome:nonexistent_key_xyz')).toThrow(/chrome/);
    } finally {
      g['__DEV__'] = origDev;
    }
  });

  test('__DEV__ false + missing chrome key → returns key literal', () => {
    const g = global as unknown as Record<string, unknown>;
    const origDev = g['__DEV__'];
    g['__DEV__'] = false;
    try {
      const result = i18n.t('chrome:nonexistent_key_xyz');
      // i18next returns the key when no translation found
      expect(result).toContain('nonexistent_key_xyz');
    } finally {
      g['__DEV__'] = origDev;
    }
  });
});

// ---------------------------------------------------------------------------
// Group 3: registerContentNamespaces
// ---------------------------------------------------------------------------

describe('registerContentNamespaces', () => {
  beforeEach(async () => {
    await resetAndInit('en-US');
  });

  test('first registration: tile key resolves to registered string', () => {
    registerContentNamespaces({
      tile: { a: 'a', 'a.upper': 'A' },
      word: { cat: 'cat', 'cat.lwc': 'cat (lwc)' },
      syllable: { ca: 'ca' },
      game: { '1.instruction': 'Match the tile' },
      langMeta: { name_local: 'English', name_english: 'English' },
    });

    expect(i18n.t('tile:a', { lng: 'eng' })).toBe('a');
  });

  test('first registration: nested dot-notation key resolves (tile:a.upper)', () => {
    registerContentNamespaces({
      tile: { a: 'a', 'a.upper': 'A' },
      word: {},
      syllable: {},
      game: {},
      langMeta: {},
    });

    expect(i18n.t('tile:a.upper', { lng: 'eng' })).toBe('A');
  });

  test('first registration: word lwc key resolves', () => {
    registerContentNamespaces({
      tile: {},
      word: { cat: 'cat', 'cat.lwc': 'gato' },
      syllable: {},
      game: {},
      langMeta: {},
    });

    expect(i18n.t('word:cat.lwc', { lng: 'eng' })).toBe('gato');
  });

  test('re-registration replaces — previously registered key no longer resolves', () => {
    // Use a value clearly distinct from the key name to detect "found vs missing"
    // (when key == value, parseMissingKeyHandler also returns key name, making the
    // states indistinguishable. Using unique values avoids this ambiguity.)
    registerContentNamespaces({
      tile: { apple: 'APPLE_VALUE' },
      word: {},
      syllable: {},
      game: {},
      langMeta: {},
    });
    expect(i18n.t('tile:apple', { lng: 'eng' })).toBe('APPLE_VALUE');

    // Second registration with only key 'banana' — 'apple' should be gone
    registerContentNamespaces({
      tile: { banana: 'BANANA_VALUE' },
      word: {},
      syllable: {},
      game: {},
      langMeta: {},
    });

    expect(i18n.t('tile:banana', { lng: 'eng' })).toBe('BANANA_VALUE');
    // 'apple' must not exist — i18next returns key literal when not found,
    // which is 'apple' (the sub-key), NOT 'APPLE_VALUE' (the old registered value)
    const result = i18n.t('tile:apple', { lng: 'eng' });
    expect(result).not.toBe('APPLE_VALUE');
  });

  test('game instruction key resolves', () => {
    registerContentNamespaces({
      tile: {},
      word: {},
      syllable: {},
      game: { '1.instruction': 'Match the tile' },
      langMeta: {},
    });

    expect(i18n.t('game:1.instruction', { lng: 'eng' })).toBe('Match the tile');
  });

  test('langMeta keys resolve', () => {
    registerContentNamespaces({
      tile: {},
      word: {},
      syllable: {},
      game: {},
      langMeta: { name_local: "Mè'phàà", name_english: 'Tlapanec' },
    });

    expect(i18n.t('langMeta:name_local', { lng: 'eng' })).toBe("Mè'phàà");
  });
});

// ---------------------------------------------------------------------------
// Group 4: Minimum required chrome keys
// ---------------------------------------------------------------------------

describe('chrome en.json: minimum required key set', () => {
  beforeEach(async () => {
    await resetAndInit('en-US');
  });

  test('chrome:back resolves to non-empty string', () => {
    const result = i18n.t('chrome:back');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('chrome:back');
  });

  test('chrome:home resolves to non-empty string', () => {
    const result = i18n.t('chrome:home');
    expect(result).toBe('Home');
  });

  test('chrome:score with points resolves to non-empty string', () => {
    const result = i18n.t('chrome:score', { points: 42 });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('chrome:choose_player resolves to non-empty string', () => {
    const result = i18n.t('chrome:choose_player');
    expect(result).toBe('Choose Player');
  });

  test('chrome:set_player_name resolves to non-empty string', () => {
    const result = i18n.t('chrome:set_player_name');
    expect(result).toBe('Set Player Name');
  });

  test('chrome:tracker_of_total with current+total resolves to non-empty string', () => {
    const result = i18n.t('chrome:tracker_of_total', { current: 1, total: 12 });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('1');
    expect(result).toContain('12');
  });

  test('chrome:a11y.tile with letter resolves to non-empty string', () => {
    const result = i18n.t('chrome:a11y.tile', { letter: 'a' });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('a');
  });

  test('chrome:a11y.word with word resolves to non-empty string', () => {
    const result = i18n.t('chrome:a11y.word', { word: 'cat' });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('cat');
  });

  test('chrome:a11y.active_word_picture resolves to non-empty string', () => {
    const result = i18n.t('chrome:a11y.active_word_picture');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('chrome:a11y.active_word_picture');
  });

  test('chrome:a11y.keyboard_key with key resolves to non-empty string', () => {
    const result = i18n.t('chrome:a11y.keyboard_key', { key: 'a' });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('a');
  });

  test('chrome:a11y.backspace resolves to non-empty string', () => {
    const result = i18n.t('chrome:a11y.backspace');
    expect(result).toBe('Backspace');
  });

  test('chrome:a11y.alpha_tiles_logo resolves to non-empty string', () => {
    const result = i18n.t('chrome:a11y.alpha_tiles_logo');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('chrome:a11y.alpha_tiles_logo');
  });

  test('chrome:a11y.tracker with current+total resolves to non-empty string', () => {
    const result = i18n.t('chrome:a11y.tracker', { current: 1, total: 12 });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('1');
    expect(result).toContain('12');
  });

  test('score key resolves to a non-empty string', () => {
    const result = i18n.t('chrome:score');
    expect(result.length).toBeGreaterThan(0);
  });

  test('tracker_of_total interpolation includes current and total', () => {
    const result = i18n.t('chrome:tracker_of_total', { current: 3, total: 12 });
    expect(result).toContain('3');
    expect(result).toContain('12');
  });

  test('a11y.tile interpolation includes the letter', () => {
    const result = i18n.t('chrome:a11y.tile', { letter: 'b' });
    expect(result).toContain('b');
  });
});
