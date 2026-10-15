import type { ImageSourcePropType } from 'react-native';
import type { ThailandType } from './decodeThailandChallengeLevel';
import type { ThailandChoice, ThailandRef, ThailandRound } from './setupThailandRound';
import { stripInstructionCharacters } from './stripInstructionCharacters';
import type { ThailandChoiceDisplay, ThailandRefDisplay } from './ThailandScreen';

function buildRefDisplay(
  ref: ThailandRef,
  imageSource: ImageSourcePropType | undefined,
  refColor: string,
): ThailandRefDisplay {
  // Java 291-320 dictates per-display rendering. WORD_TEXT specifically
  // renders stripInstructionCharacters(wordInLOP) on a white background with
  // black text (Java 305-309); other text refs use refColor bg + white text.
  switch (ref.display) {
    case 'TILE_LOWER':
      return {
        type: 'text',
        text: ref.kind === 'tile' ? ref.tileRow.base : '',
        backgroundColor: refColor,
      };
    case 'TILE_UPPER':
      return {
        type: 'text',
        text: ref.kind === 'tile' ? (ref.tileRow.upper || ref.tileRow.base) : '',
        backgroundColor: refColor,
      };
    case 'TILE_AUDIO':
      return { type: 'audio', refType: ref.display };
    case 'WORD_TEXT':
      return {
        type: 'text',
        text: ref.kind === 'word' ? stripInstructionCharacters(ref.wordRow.wordInLOP) : '',
        backgroundColor: '#FFFFFF',
      };
    case 'WORD_IMAGE':
      return {
        type: 'image',
        imageSource,
        wordLabel: ref.kind === 'word' ? stripInstructionCharacters(ref.wordRow.wordInLOP) : '',
      };
    case 'WORD_AUDIO':
      return { type: 'audio', refType: ref.display };
    case 'SYLLABLE_TEXT':
      return {
        type: 'text',
        text: ref.kind === 'syllable' ? ref.syllableRow.syllable : '',
        backgroundColor: refColor,
      };
    case 'SYLLABLE_AUDIO':
      return { type: 'audio', refType: ref.display };
    default:
      return { type: 'text', text: '', backgroundColor: refColor };
  }
}

function choiceText(choice: ThailandChoice) {
  if (choice.kind === 'tile') return choice.displayText;
  if (choice.kind === 'syllable') return choice.syllableRow.syllable;
  return stripInstructionCharacters(choice.wordRow.wordInLOP);
}

type Four<T> = [T, T, T, T];

/**
 * What a Thailand round looks like on screen: the reference cell, the four
 * choice cells and their screen-reader labels (localized text, never the LWC
 * slug — that would read out the answer). Shared by the Thailand game and the
 * self-test (#42), which render the same `ThailandScreen`.
 *
 * `wordImages` = the pack's word images keyed by `wordInLWC`.
 */
export function thailandRoundView({
  round,
  choiceType,
  wordImages,
  refColor,
}: {
  round: ThailandRound;
  choiceType: ThailandType;
  wordImages: Record<string, unknown>;
  refColor: string;
}) {
  const refImageSource =
    round.ref.kind === 'word' && round.ref.display === 'WORD_IMAGE'
      ? (wordImages[round.ref.wordRow.wordInLWC] as ImageSourcePropType | undefined)
      : undefined;

  const choices = round.choices.map((choice): ThailandChoiceDisplay => {
    if (choice.kind === 'word' && choiceType === 'WORD_IMAGE') {
      return {
        type: 'image',
        imageSource: wordImages[choice.wordRow.wordInLWC] as ImageSourcePropType | undefined,
        wordLabel: stripInstructionCharacters(choice.wordRow.wordInLOP),
      };
    }
    return { type: 'text', text: choiceText(choice) };
  }) as Four<ThailandChoiceDisplay>;

  return {
    refDisplay: buildRefDisplay(round.ref, refImageSource, refColor),
    choices,
    choiceLabels: round.choices.map(choiceText) as Four<string>,
  };
}
