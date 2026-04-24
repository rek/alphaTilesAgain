import type { TileEntry, ParsedTile } from './TileEntry';
import type { ParseWordOptions } from './parseWordIntoTiles';
import { parseWordIntoTiles as parseDefault } from './parseWordIntoTiles';

export type ScriptParser = {
  parse: (opts: ParseWordOptions) => ParsedTile[] | null;
  /** Combine parsed tiles back into a word string. indexOfReplacedTile = -1 for round-trip. */
  combine: (tiles: ParsedTile[], wordInLOP: string, indexOfReplacedTile: number) => string;
  standardizeSequence: (opts: ParseWordOptions) => string;
};

const registry = new Map<string, ScriptParser>();

export function registerScriptParser(scriptType: string, parser: ScriptParser): void {
  if (registry.has(scriptType)) {
    throw new Error(`util-phoneme: parser already registered for scriptType '${scriptType}'`);
  }
  registry.set(scriptType, parser);
}

export function getParser(scriptType: string): ScriptParser {
  const parser = registry.get(scriptType);
  if (!parser) {
    if (scriptType !== 'default') {
      console.warn(
        `util-phoneme: no parser registered for scriptType '${scriptType}', falling back to 'default'`,
      );
    }
    return registry.get('default')!;
  }
  return parser;
}

// Default Roman/unidirectional parser — registered at module load.
const defaultParser: ScriptParser = {
  parse: (opts) => parseDefault(opts),

  // Ports GameActivity.java:952 for Roman/default: strip placeholder chars and join.
  // Complex-script reordering (Thai/Lao/Khmer/Arabic) is future work in per-script parsers.
  combine: (tiles, _wordInLOP, _indexOfReplacedTile) =>
    tiles.map((t) => t.base).join(''),

  standardizeSequence: (opts) => {
    const tiles = parseDefault(opts);
    if (!tiles) return opts.wordInLOP;
    return tiles.map((t) => t.base).join('');
  },
};

registerScriptParser('default', defaultParser);
