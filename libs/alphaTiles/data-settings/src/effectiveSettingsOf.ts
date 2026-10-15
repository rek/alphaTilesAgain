import type { LangAssets } from '@alphaTiles/data-language-pack';
import type { PlayerPreferences } from '@alphaTiles/data-players';

/**
 * aa_settings.txt labels + defaults for the cross-cutting settings. The ONLY
 * place these English labels are spelled (a typo here fails the tests, not a
 * silent default at one call site — cf. 383279d).
 */
const PACK = {
  showGameNames: { label: 'Show game names', fallback: true },
  changeArrowColors: { label: 'Change arrow colors', fallback: false },
  hasTileAudio: { label: 'Has tile audio', fallback: false },
  hasSyllableAudio: { label: 'Has syllable audio', fallback: false },
  hidePrivacyPolicy: { label: 'Hide privacy policy', fallback: false },
  afterTwelveCheckedTrackers: { label: 'After 12 checked trackers', fallback: 3 },
  numberOfAvatars: { label: 'Number of avatars', fallback: 12 },
} as const;

/**
 * Effective settings: the pack's aa_settings.txt values, typed and defaulted,
 * with the player's preferences layered on top of the player-overridable ones.
 *
 * Unset preference → pack value → built-in default. Game-specific settings
 * (Chile keyboard, Italy deck size, Mexico timing …) stay with their game.
 */
export function effectiveSettingsOf({
  settings,
  preferences = {},
}: {
  settings: Pick<LangAssets['settings'], 'findBoolean' | 'findInt'>;
  preferences?: PlayerPreferences;
}) {
  const bool = (key: keyof typeof PACK) => {
    const { label, fallback } = PACK[key];
    return settings.findBoolean(label, fallback as boolean);
  };
  const int = (key: keyof typeof PACK) => {
    const { label, fallback } = PACK[key];
    return settings.findInt(label, fallback as number);
  };

  return {
    /** Menu doors show their pack GameName (#37). Player-overridable (#44). */
    showGameNames: preferences.showGameNames ?? bool('showGameNames'),
    /**
     * Java "Change arrow colors" (Start.java:128): grey the shell's advance
     * arrow while repeat-locked. Java defaults true; we keep false so
     * no-right/wrong games' arrow is never stuck grey.
     */
    changeArrowColors: bool('changeArrowColors'),
    hasTileAudio: bool('hasTileAudio'),
    hasSyllableAudio: bool('hasSyllableAudio'),
    hidePrivacyPolicy: bool('hidePrivacyPolicy'),
    /** After 12 trackers: 1 keep playing, 2 menu, 3 celebrate + next game (see resolveMasteryAction). */
    afterTwelveCheckedTrackers: int('afterTwelveCheckedTrackers'),
    numberOfAvatars: int('numberOfAvatars'),
  };
}

export type EffectiveSettings = ReturnType<typeof effectiveSettingsOf>;
