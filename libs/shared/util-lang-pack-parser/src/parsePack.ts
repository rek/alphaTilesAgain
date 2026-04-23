import { LangPackParseError } from './LangPackParseError';
import { parseColors } from './parseColors';
import { parseGames } from './parseGames';
import { parseGametiles } from './parseGametiles';
import { parseKeyboard } from './parseKeyboard';
import { parseLangInfo } from './parseLangInfo';
import { parseNames } from './parseNames';
import { parseResources } from './parseResources';
import { parseSettings } from './parseSettings';
import { parseShare } from './parseShare';
import { parseSyllables } from './parseSyllables';
import { parseWordlist } from './parseWordlist';

/** Required rawFiles keys in iteration order. */
const REQUIRED_KEYS = [
  'aa_gametiles',
  'aa_wordlist',
  'aa_syllables',
  'aa_keyboard',
  'aa_games',
  'aa_langinfo',
  'aa_settings',
  'aa_names',
  'aa_resources',
  'aa_colors',
  'aa_share',
] as const;

/**
 * Parse every aa_*.txt file in a language pack in one call.
 *
 * Accepts a `Record<string, string>` keyed by `aa_<name>` (no extension),
 * matching the `langManifest.rawFiles` convention from port-foundations.
 *
 * Each per-file parser is called exactly once. Any LangPackParseError thrown
 * by a child parser propagates unchanged.
 *
 * Throws LangPackParseError (with `reason: 'missing from rawFiles'`) for the
 * first required key that is absent from rawFiles, in REQUIRED_KEYS iteration order.
 *
 * Design decision D5: flat wrapper — no extra behaviour, no error accumulation.
 *
 * @returns `{ tiles, words, syllables, keys, games, langInfo, settings, names, resources, colors, share }`
 */
export function parsePack(rawFiles: Record<string, string>) {
  for (const key of REQUIRED_KEYS) {
    if (!(key in rawFiles)) {
      throw new LangPackParseError({
        file: key,
        line: 0,
        reason: 'missing from rawFiles',
      });
    }
  }

  return {
    tiles: parseGametiles(rawFiles['aa_gametiles']),
    words: parseWordlist(rawFiles['aa_wordlist']),
    syllables: parseSyllables(rawFiles['aa_syllables']),
    keys: parseKeyboard(rawFiles['aa_keyboard']),
    games: parseGames(rawFiles['aa_games']),
    langInfo: parseLangInfo(rawFiles['aa_langinfo']),
    settings: parseSettings(rawFiles['aa_settings']),
    names: parseNames(rawFiles['aa_names']),
    resources: parseResources(rawFiles['aa_resources']),
    colors: parseColors(rawFiles['aa_colors']),
    share: parseShare(rawFiles['aa_share']),
  };
}
