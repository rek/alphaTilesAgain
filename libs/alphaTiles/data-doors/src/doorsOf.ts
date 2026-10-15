import type { LangAssets } from '@alphaTiles/data-language-pack';
import { displayChallengeLevel } from '@alphaTiles/util-scoring';
import { isStrokeGameEnabled } from './internal/isStrokeGameEnabled';

const FALLBACK_COLOR = '#666666';
/** No-right/wrong classes: no points, no trackers, always "in progress" on the menu. */
const NO_TRACKER_COUNTRIES = ['Romania', 'Sudan', 'Malaysia', 'Iraq'];

/** The slice of the pack a Door is resolved from. */
export type DoorPack = Pick<LangAssets, 'games' | 'colors' | 'settings' | 'strokes'> & {
  audio: Pick<LangAssets['audio'], 'instructions'>;
};

/**
 * Door catalogue: every `aa_games.txt` row resolved once into a Door — the one
 * place class, variant, challenge level, stage, colour, instruction audio,
 * progress rule and visibility are derived. Menu, shell, next-game search and
 * game containers all read Doors; none read `games.rows` directly.
 *
 * Invariants:
 * - Returns ALL rows in file order, so `doors[i].index === i + 1`.
 *   `index` is the raw row position (= route `doorIndex`); never renumber it
 *   from a display sort (difficulty-ladder design D2).
 * - Hidden doors stay in the list with `enabled: false`; callers that show
 *   doors filter on it.
 */
export function doorsOf(pack: DoorPack) {
  const strokeGameEnabled = isStrokeGameEnabled(pack);

  return pack.games.rows.map((row, i) => {
    const variant = row.syllOrTile;
    const stage = row.stagesIncluded === '-' ? 1 : parseInt(row.stagesIncluded, 10) || 1;
    const instructionAudio =
      row.instructionAudio && row.instructionAudio in pack.audio.instructions
        ? row.instructionAudio
        : undefined;
    return {
      /** 1-based raw aa_games.txt row position; the route `doorIndex`. */
      index: i + 1,
      /** Kebab-case route segment, e.g. `united-states`. */
      classKey: row.classKey,
      /** Java class name, e.g. `UnitedStates`. */
      country: row.country,
      /** Raw, class-specific code (see GAME_PATTERNS "Challenge level decoding"). */
      challengeLevel: row.challengeLevel,
      /** Level shown in the shell header (Java GameActivity display rules). */
      displayLevel: displayChallengeLevel(row.country, row.challengeLevel),
      /** `S` = syllable mode, `T` = tile mode. */
      variant,
      stage,
      colorHex: pack.colors.hexByIndex[parseInt(row.color, 10) || 0] ?? FALLBACK_COLOR,
      /** Instruction clip id, only when the pack bundles it. */
      instructionAudio,
      /** False for no-right/wrong classes (Romania, Sudan, Malaysia, Iraq). */
      tracksProgress: !NO_TRACKER_COUNTRIES.includes(row.country),
      /** False when the door is hidden from the menu (e.g. Taiwan without stroke data). */
      enabled: row.classKey === 'taiwan' ? strokeGameEnabled : true,
      /**
       * Progress-store key for this door + player. Java
       * uniqueGameLevelPlayerModeStageID: country + level + player + (S|'') + stage,
       * e.g. `China1player011`. Persisted — changing the format orphans progress.
       */
      progressKey: (playerId: string) =>
        `${row.country}${row.challengeLevel}${playerId}${variant === 'S' ? 'S' : ''}${stage}`,
    };
  });
}

export type Door = ReturnType<typeof doorsOf>[number];
