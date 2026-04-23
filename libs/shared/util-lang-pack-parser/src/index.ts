// Error class
export { LangPackParseError } from './LangPackParseError';

// Per-file parsers
export { parseColors } from './parseColors';
export { parseGames } from './parseGames';
export { parseGametiles } from './parseGametiles';
export { parseKeyboard } from './parseKeyboard';
export { parseLangInfo } from './parseLangInfo';
export { parseNames } from './parseNames';
export { parseResources } from './parseResources';
export { parseSettings } from './parseSettings';
export { parseShare } from './parseShare';
export { parseSyllables } from './parseSyllables';
export { parseWordlist } from './parseWordlist';

// Aggregate parser
export { parsePack } from './parsePack';

// Convenience types derived from return shapes (no separate types file per project rules)
import { parsePack } from './parsePack';
import { parseColors } from './parseColors';
import { parseGames } from './parseGames';
import { parseGametiles } from './parseGametiles';
import { parseKeyboard } from './parseKeyboard';
import { parseLangInfo } from './parseLangInfo';
import { parseNames } from './parseNames';
import { parseResources } from './parseResources';
import { parseSettings } from './parseSettings';
import { parseSyllables } from './parseSyllables';
import { parseWordlist } from './parseWordlist';

export type ParsedPack = ReturnType<typeof parsePack>;
export type ParsedColors = ReturnType<typeof parseColors>;
export type ParsedGames = ReturnType<typeof parseGames>;
export type ParsedGametiles = ReturnType<typeof parseGametiles>;
export type ParsedKeyboard = ReturnType<typeof parseKeyboard>;
export type ParsedLangInfo = ReturnType<typeof parseLangInfo>;
export type ParsedNames = ReturnType<typeof parseNames>;
export type ParsedResources = ReturnType<typeof parseResources>;
export type ParsedSettings = ReturnType<typeof parseSettings>;
export type ParsedSyllables = ReturnType<typeof parseSyllables>;
export type ParsedWordlist = ReturnType<typeof parseWordlist>;
