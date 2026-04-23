/**
 * Full tile parsing — port of TileList.parseWordIntoTiles from Validator.java.
 *
 * Java reference: Validator.java ~line 2858.
 *
 * For Roman script: delegates to parseWordIntoTilesPreliminary (no further processing).
 * For Thai/Lao/Khmer/Arabic (complex scripts): combines preliminary tiles into
 * complex vowel/consonant groupings respecting the script structure.
 *
 * Returns null if the word cannot be parsed.
 */

import type { TileEntry, ParsedTile } from './TileEntry';
import {
  parseWordIntoTilesPreliminary,
  getMultitypeTiles,
} from './parseWordIntoTilesPreliminary';
import { buildTileHashMap } from './buildTileHashMap';

export type ScriptType = 'Roman' | 'Arabic' | 'Devanagari' | 'Khmer' | 'Lao' | 'Thai';

export interface ParseWordOptions {
  wordInLOP: string;
  mixedDefs: string;
  tiles: TileEntry[];
  scriptType: ScriptType;
  placeholderCharacter: string;
}

export function parseWordIntoTiles(opts: ParseWordOptions): ParsedTile[] | null {
  const { wordInLOP, mixedDefs, tiles, scriptType, placeholderCharacter } = opts;

  const tileMap = buildTileHashMap(tiles, placeholderCharacter);
  const multitypeTiles = getMultitypeTiles(tiles);

  const preliminary = parseWordIntoTilesPreliminary(
    wordInLOP,
    mixedDefs,
    tileMap,
    multitypeTiles,
    placeholderCharacter,
  );

  if (preliminary === null) return null;

  // For non-complex scripts: preliminary parse IS the final parse
  if (!['Thai', 'Lao', 'Khmer', 'Arabic'].includes(scriptType)) {
    return preliminary;
  }

  // For complex scripts: combine vowel/consonant groupings
  return combineComplexScript(preliminary, tileMap, placeholderCharacter);
}

/**
 * Complex-script syllable combination logic.
 * Port of TileList.parseWordIntoTiles() for Thai/Lao/Khmer/Arabic.
 *
 * Java reference: Validator.java ~line 2865–3054.
 */
function combineComplexScript(
  preliminary: ParsedTile[],
  tileMap: Map<string, TileEntry>,
  placeholderCharacter: string,
): ParsedTile[] | null {
  const result: ParsedTile[] = [];

  let consonantScanIndex = 0;
  let currentConsonantIndex = 0;
  let previousConsonantIndex = -1;
  let nextConsonantIndex = preliminary.length;

  while (consonantScanIndex < preliminary.length) {
    // Find the current consonant
    let currentConsonant: ParsedTile | null = null;
    let foundNextConsonant = false;

    while (!foundNextConsonant && consonantScanIndex < preliminary.length) {
      const tile = preliminary[consonantScanIndex];
      if (tile.typeOfThisTileInstance === 'C' || tile.typeOfThisTileInstance === 'PC') {
        currentConsonant = tile;
        currentConsonantIndex = consonantScanIndex;
        foundNextConsonant = true;
      }
      consonantScanIndex++;
    }

    if (!foundNextConsonant) {
      currentConsonantIndex = preliminary.length;
    }

    // Find the next consonant after current
    foundNextConsonant = false;
    const savedScan = consonantScanIndex;
    while (!foundNextConsonant && consonantScanIndex < preliminary.length) {
      const tile = preliminary[consonantScanIndex];
      if (tile.typeOfThisTileInstance === 'C' || tile.typeOfThisTileInstance === 'PC') {
        nextConsonantIndex = consonantScanIndex;
        foundNextConsonant = true;
      }
      consonantScanIndex++;
    }
    if (!foundNextConsonant) {
      nextConsonantIndex = preliminary.length;
    }

    // Collect vowels/diacritics between previous and current consonants
    let vowelStringSoFar = '';
    let vowelTypeSoFar = '';
    let diacriticStringSoFar = '';
    const sadTiles: ParsedTile[] = [];
    let nonCombiningVowelFromPrev: ParsedTile | null = null;

    for (let b = previousConsonantIndex + 1; b < currentConsonantIndex; b++) {
      const t = preliminary[b];
      if (t.typeOfThisTileInstance === 'LV') {
        vowelStringSoFar += t.base;
        vowelTypeSoFar = vowelTypeSoFar === '' ? t.typeOfThisTileInstance : vowelTypeSoFar;
      } else if (t.typeOfThisTileInstance === 'V') {
        nonCombiningVowelFromPrev = t;
      }
    }

    // Collect vowels/diacritics between current and next consonants
    let nonComplexV: ParsedTile | null = null;
    for (let a = currentConsonantIndex + 1; a < nextConsonantIndex; a++) {
      const t = preliminary[a];
      const tStr = t.base;
      const tType = t.typeOfThisTileInstance;

      if (tType === 'AV' || tType === 'BV' || tType === 'FV') {
        if (tileMap.has(vowelStringSoFar)) {
          if (vowelTypeSoFar === 'LV') {
            if (!vowelStringSoFar.endsWith(placeholderCharacter)) {
              vowelStringSoFar += placeholderCharacter;
            }
          } else if ((vowelTypeSoFar === 'AV' || vowelTypeSoFar === 'BV' || vowelTypeSoFar === 'FV') && !vowelStringSoFar.startsWith(placeholderCharacter)) {
            vowelStringSoFar = placeholderCharacter + vowelStringSoFar;
          }
        }
        const currentStr = (vowelStringSoFar.includes(placeholderCharacter) && tStr.includes(placeholderCharacter))
          ? tStr.replace(placeholderCharacter, '')
          : tStr;
        vowelStringSoFar += currentStr;
        if (vowelStringSoFar === currentStr) {
          vowelTypeSoFar = tType;
        } else if (tileMap.has(vowelStringSoFar)) {
          vowelTypeSoFar = tileMap.get(vowelStringSoFar)!.type;
        }
      } else if (tType === 'AD' || tType === 'D') {
        if (diacriticStringSoFar !== '' && !diacriticStringSoFar.includes(placeholderCharacter)) {
          diacriticStringSoFar = placeholderCharacter + diacriticStringSoFar;
        }
        const currentStr = (diacriticStringSoFar.includes(placeholderCharacter) && tStr.includes(placeholderCharacter))
          ? tStr.replace(placeholderCharacter, '')
          : tStr;
        diacriticStringSoFar += currentStr;
      } else if (tType === 'SAD') {
        sadTiles.push(t);
      } else if (!foundNextConsonant && tType === 'V') {
        nonComplexV = t;
      }
    }

    // Add to result
    if (nonCombiningVowelFromPrev !== null) result.push(nonCombiningVowelFromPrev);

    if (currentConsonant !== null) {
      // Combine diacritics with consonant if possible
      let resolvedConsonant = currentConsonant;
      if (diacriticStringSoFar !== '' && tileMap.has(currentConsonant.base + diacriticStringSoFar.replace(placeholderCharacter, ''))) {
        const combined = tileMap.get(currentConsonant.base + diacriticStringSoFar.replace(placeholderCharacter, ''))!;
        resolvedConsonant = {
          base: combined.base,
          typeOfThisTileInstance: combined.type,
          stageOfFirstAppearanceForThisTileType: combined.stageOfFirstAppearance,
          audioForThisTileType: combined.audioName,
          tileType: combined.type,
          tileTypeB: combined.tileTypeB,
          tileTypeC: combined.tileTypeC,
        };
        diacriticStringSoFar = '';
      }

      if (vowelStringSoFar !== '') {
        const vowelTileEntry = tileMap.get(vowelStringSoFar);
        if (vowelTileEntry === undefined) {
          // Can't combine — just add consonant
          result.push(resolvedConsonant);
        } else {
          const vowelTile: ParsedTile = {
            base: vowelTileEntry.base,
            typeOfThisTileInstance: vowelTileEntry.type,
            stageOfFirstAppearanceForThisTileType: vowelTileEntry.stageOfFirstAppearance,
            audioForThisTileType: vowelTileEntry.audioName,
            tileType: vowelTileEntry.type,
            tileTypeB: vowelTileEntry.tileTypeB,
            tileTypeC: vowelTileEntry.tileTypeC,
          };
          switch (vowelTypeSoFar) {
            case 'LV':
              result.push(vowelTile);
              result.push(resolvedConsonant);
              if (diacriticStringSoFar !== '') {
                const dTile = tileMap.get(diacriticStringSoFar);
                if (dTile) result.push({
                  base: dTile.base, typeOfThisTileInstance: dTile.type,
                  stageOfFirstAppearanceForThisTileType: dTile.stageOfFirstAppearance,
                  audioForThisTileType: dTile.audioName,
                  tileType: dTile.type, tileTypeB: dTile.tileTypeB, tileTypeC: dTile.tileTypeC,
                });
              }
              break;
            case 'AV':
            case 'BV':
            case 'V':
              result.push(resolvedConsonant);
              result.push(vowelTile);
              if (diacriticStringSoFar !== '') {
                const dTile = tileMap.get(diacriticStringSoFar);
                if (dTile) result.push({
                  base: dTile.base, typeOfThisTileInstance: dTile.type,
                  stageOfFirstAppearanceForThisTileType: dTile.stageOfFirstAppearance,
                  audioForThisTileType: dTile.audioName,
                  tileType: dTile.type, tileTypeB: dTile.tileTypeB, tileTypeC: dTile.tileTypeC,
                });
              }
              break;
            case 'FV':
              result.push(resolvedConsonant);
              if (diacriticStringSoFar !== '') {
                const dTile = tileMap.get(diacriticStringSoFar);
                if (dTile) result.push({
                  base: dTile.base, typeOfThisTileInstance: dTile.type,
                  stageOfFirstAppearanceForThisTileType: dTile.stageOfFirstAppearance,
                  audioForThisTileType: dTile.audioName,
                  tileType: dTile.type, tileTypeB: dTile.tileTypeB, tileTypeC: dTile.tileTypeC,
                });
              }
              result.push(vowelTile);
              break;
            default:
              result.push(resolvedConsonant);
              result.push(vowelTile);
          }
        }
      } else {
        result.push(resolvedConsonant);
        if (diacriticStringSoFar !== '') {
          const dTile = tileMap.get(diacriticStringSoFar);
          if (dTile) {
            if (dTile.type === 'AD') {
              result.push({
                base: dTile.base, typeOfThisTileInstance: dTile.type,
                stageOfFirstAppearanceForThisTileType: dTile.stageOfFirstAppearance,
                audioForThisTileType: dTile.audioName,
                tileType: dTile.type, tileTypeB: dTile.tileTypeB, tileTypeC: dTile.tileTypeC,
              });
            }
          }
        }
      }

      if (nonComplexV !== null) result.push(nonComplexV);

      if (diacriticStringSoFar !== '') {
        const dTile = tileMap.get(diacriticStringSoFar);
        if (dTile && dTile.type === 'D') {
          result.push({
            base: dTile.base, typeOfThisTileInstance: dTile.type,
            stageOfFirstAppearanceForThisTileType: dTile.stageOfFirstAppearance,
            audioForThisTileType: dTile.audioName,
            tileType: dTile.type, tileTypeB: dTile.tileTypeB, tileTypeC: dTile.tileTypeC,
          });
        }
      }

      for (const sadTile of sadTiles) result.push(sadTile);

      previousConsonantIndex = currentConsonantIndex;
    }

    consonantScanIndex = nextConsonantIndex;
  }

  return result;
}
