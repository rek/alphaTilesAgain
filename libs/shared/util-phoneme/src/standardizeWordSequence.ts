import type { ScriptType, ParseWordOptions } from './parseWordIntoTiles';
import { getParser } from './scriptRegistry';

export function standardizeWordSequence(
  opts: ParseWordOptions,
  scriptType: ScriptType | string = 'default',
): string {
  return getParser(scriptType).standardizeSequence(opts);
}
