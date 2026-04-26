/**
 * Container for the Brazil "find the missing tile" game.
 *
 * BrazilContainer renders GameShellContainer (outer); BrazilGame is the inner
 * component that calls useGameShell() and owns all game state.
 *
 * Port of Brazil.java (~640 LOC) — see design.md for the full mapping table.
 *
 * Per-CL routing:
 *   - syllableGame === 'S' → syllable mechanic (SL1 / SL2)
 *   - else CL1–3 → vowel-blank, CL4–6 → consonant-blank, CL7 → tone-blank
 *
 * Wrong tap ends the round (Brazil.java setAllGameButtonsUnclickable in
 * respondToTileSelection — see design.md spec R5).
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
  useShellAdvance,
} from '@alphaTiles/feature-game-shell';
import {
  buildTileHashMap,
  getMultitypeTiles,
  parseWordIntoTilesPreliminary,
} from '@shared/util-phoneme';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import { BrazilScreen } from './BrazilScreen';
import type { ChoiceDisplay, DisplayTile } from './BrazilScreen';
import { blankRandomTileOfType } from './blankRandomTileOfType';
import { buildChoices } from './buildChoices';
import { buildSyllableChoices } from './buildSyllableChoices';
import { pickWordOfType } from './pickWordOfType';
import type { RequiredTileType } from './pickWordOfType';
import type { BrazilData } from './brazilPreProcess';

const COLOR_FALLBACK = ['#E91E63', '#3F51B5', '#009688', '#FF9800', '#9C27B0'];

const ADVANCE_DELAY_MS = 1200;

type WordRow = LangAssets['words']['rows'][number];
type SyllableRow = LangAssets['syllables']['rows'][number];

type RouteParams = Record<string, string | string[] | undefined>;

function challengeLevelToRequiredType(cl: number): RequiredTileType {
  if (cl >= 1 && cl <= 3) return 'vowel';
  if (cl >= 4 && cl <= 6) return 'consonant';
  return 'tone';
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Round =
  | {
      kind: 'tile';
      word: WordRow;
      displayTiles: DisplayTile[];
      fullWord: string;
      choices: ChoiceDisplay[];
      visibleChoiceCount: number;
      correctText: string;
    }
  | {
      kind: 'syllable';
      word: WordRow;
      displayTiles: DisplayTile[];
      fullWord: string;
      choices: ChoiceDisplay[];
      visibleChoiceCount: number;
      correctText: string;
    };

function BrazilGame({
  challengeLevel,
  syllableGame,
}: {
  challengeLevel: number;
  syllableGame: string;
}): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();
  const data = usePrecompute<BrazilData>('brazil');

  const scriptType = assets.langInfo.find('Script type') ?? 'Roman';
  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';

  const tileMap = useMemo(
    () => buildTileHashMap(assets.tiles.rows, placeholderChar),
    [assets.tiles.rows, placeholderChar],
  );
  const multitypeTiles = useMemo(() => getMultitypeTiles(assets.tiles.rows), [assets.tiles.rows]);
  const colorList = assets.colors.hexByIndex.length > 0 ? assets.colors.hexByIndex : COLOR_FALLBACK;

  const requiredType = challengeLevelToRequiredType(challengeLevel);
  const isSyllableMode = syllableGame === 'S';

  const wordPoolRef = useRef<WordRow[]>([]);
  const isMountedRef = useRef(true);
  const [round, setRound] = useState<Round | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<'insufficient-content' | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickNextWord = useCallback((): WordRow | null => {
    if (wordPoolRef.current.length === 0) {
      wordPoolRef.current = shuffle(assets.words.rows);
    }
    return wordPoolRef.current.pop() ?? null;
  }, [assets.words.rows]);

  const parseWord = useCallback(
    (word: WordRow) =>
      parseWordIntoTilesPreliminary(
        word.wordInLOP,
        word.mixedDefs,
        tileMap,
        multitypeTiles,
        placeholderChar,
      ),
    [tileMap, multitypeTiles, placeholderChar],
  );

  const startRound = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setRevealed(false);

    if (isSyllableMode) {
      const word = pickNextWord();
      if (!word) {
        setError('insufficient-content');
        return;
      }
      // Syllable mechanic: parse into syllables.
      const parsedSyllables = parseWordIntoSyllables(word, assets.syllables.rows);
      if (parsedSyllables.length === 0) {
        startRound();
        return;
      }
      const idx = Math.floor(Math.random() * parsedSyllables.length);
      const correctSyllable = parsedSyllables[idx];
      const displayTiles = parsedSyllables.map((s, i) => ({ text: i === idx ? '__' : s.syllable, isBlank: i === idx }));
      const fullWord = parsedSyllables.map((s) => s.syllable).join('');
      const { choices, visibleChoiceCount } = buildSyllableChoices({
        challengeLevel,
        correct: correctSyllable,
        syllablePool: data.syllables,
        allSyllables: assets.syllables.rows,
      });

      setRound({
        kind: 'syllable',
        word,
        displayTiles,
        fullWord,
        choices: decorateChoices(choices, colorList),
        visibleChoiceCount,
        correctText: correctSyllable.syllable,
      });
      shell.setRefWord({ wordInLOP: word.wordInLOP, wordInLWC: word.wordInLWC });
      audio.playWord(word.wordInLWC);
      return;
    }

    // Tile mechanic.
    const result = pickWordOfType<WordRow>({
      pickOne: () => pickNextWord() as WordRow,
      parse: (w) => {
        if (!w) return null;
        const parsed = parseWord(w);
        return parsed;
      },
      required: requiredType,
    });

    if (!result) {
      setError('insufficient-content');
      return;
    }

    const blanked = blankRandomTileOfType(
      result.parsed,
      requiredType,
      scriptType,
      placeholderChar,
    );
    if (!blanked) {
      // Shouldn't happen since pickWordOfType guarantees presence, but retry defensively.
      startRound();
      return;
    }

    const fullWord = result.parsed.map((t) => t.base).join('');
    const correctTile = result.parsed[blanked.blankIndex];
    const tileRow = assets.tiles.rows.find((t) => t.base === correctTile.base);
    const correctRef = tileRow ?? {
      base: correctTile.base,
      alt1: '',
      alt2: '',
      alt3: '',
    };

    const { choices, visibleChoiceCount } = buildChoices({
      challengeLevel,
      correct: correctRef,
      vowels: data.vowels,
      consonants: data.consonants,
      tones: data.tones,
    });

    setRound({
      kind: 'tile',
      word: result.word,
      displayTiles: blanked.display,
      fullWord,
      choices: decorateChoices(choices, colorList),
      visibleChoiceCount,
      correctText: correctTile.base,
    });
    shell.setRefWord({ wordInLOP: result.word.wordInLOP, wordInLWC: result.word.wordInLWC });
    audio.playWord(result.word.wordInLWC);
  }, [
    isSyllableMode,
    challengeLevel,
    requiredType,
    scriptType,
    placeholderChar,
    pickNextWord,
    parseWord,
    data,
    assets.syllables.rows,
    assets.tiles.rows,
    colorList,
    shell,
    audio,
  ]);

  useEffect(() => {
    startRound();
    return () => {
      isMountedRef.current = false;
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useShellAdvance(startRound);

  const onChoice = useCallback(
    (index: number) => {
      if (!round) return;
      if (revealed) return;
      if (shell.interactionLocked) return;

      const picked = round.choices[index];
      if (!picked || !picked.visible) return;

      if (picked.text === round.correctText) {
        // Correct: reveal full word, gray non-correct, mark correct, increment, play, schedule advance.
        const updated = round.choices.map((c, i) => ({
          ...c,
          highlightCorrect: i === index,
          greyed: i !== index && c.visible,
          disabled: true,
        }));
        setRound({ ...round, choices: updated });
        setRevealed(true);
        shell.incrementPointsAndTracker(true);
        audio.playCorrect().then(() => {
          if (!isMountedRef.current) return;
          audio.playWord(round.word.wordInLWC);
        });
        advanceTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) startRound();
        }, ADVANCE_DELAY_MS);
      } else {
        // Wrong: lock buttons, flash red on the picked choice, play incorrect.
        const updated = round.choices.map((c, i) => ({
          ...c,
          wrong: i === index,
          disabled: true,
        }));
        setRound({ ...round, choices: updated });
        shell.incrementPointsAndTracker(false);
        audio.playIncorrect();
      }
    },
    [round, revealed, shell, audio, startRound],
  );

  const onWordImagePress = useCallback(() => {
    if (!round) return;
    audio.playWord(round.word.wordInLWC);
  }, [round, audio]);

  if (error === 'insufficient-content') {
    return (
      <BrazilScreen
        displayTiles={[]}
        fullWord=""
        revealed={false}
        choices={Array.from({ length: 4 }, () => ({
          text: '',
          visible: false,
          color: '#000',
          greyed: false,
          wrong: false,
          highlightCorrect: false,
          disabled: true,
        }))}
        visibleChoiceCount={4}
        wordImage={undefined}
        wordLabel=""
        onChoice={() => undefined}
        onWordImagePress={() => undefined}
        accessibilityChoiceLabels={['', '', '', '']}
      />
    );
  }

  if (!round) return <></>;

  const wordImage = assets.images.words[round.word.wordInLWC] as ImageSourcePropType | undefined;

  const a11yLabels = round.choices.map((c) => c.text);

  return (
    <BrazilScreen
      displayTiles={round.displayTiles}
      fullWord={round.fullWord}
      revealed={revealed}
      choices={round.choices}
      visibleChoiceCount={round.visibleChoiceCount}
      wordImage={wordImage}
      wordLabel={round.word.wordInLWC}
      onChoice={onChoice}
      onWordImagePress={onWordImagePress}
      accessibilityChoiceLabels={a11yLabels}
    />
  );
}

function decorateChoices(
  raw: { text: string; visible: boolean }[],
  colorList: string[],
): ChoiceDisplay[] {
  return raw.map((c, i) => ({
    text: c.text,
    visible: c.visible,
    color: colorList[i % colorList.length] ?? COLOR_FALLBACK[i % COLOR_FALLBACK.length],
    greyed: false,
    wrong: false,
    highlightCorrect: false,
    disabled: false,
  }));
}

/**
 * Naive longest-match syllable parser — returns the SyllableRow array that
 * makes up the word's LOP form. Mirrors Brazil.java's syllableList.parseWordIntoSyllables.
 * If parse fails, returns [] and caller retries with another word.
 */
function parseWordIntoSyllables(word: WordRow, syllables: SyllableRow[]): SyllableRow[] {
  if (syllables.length === 0) return [];
  const sorted = [...syllables].sort((a, b) => b.syllable.length - a.syllable.length);
  const lop = word.wordInLOP.replace(/[#.]/g, '');
  const result: SyllableRow[] = [];
  let i = 0;
  while (i < lop.length) {
    let matched: SyllableRow | undefined;
    for (const s of sorted) {
      if (s.syllable.length > 0 && lop.startsWith(s.syllable, i)) {
        matched = s;
        break;
      }
    }
    if (!matched) return [];
    result.push(matched);
    i += matched.syllable.length;
  }
  return result;
}

export function BrazilContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const challengeLevel = parseInt((props.challengeLevel as string) ?? '1', 10);
  const syllableGame = (props.syllableGame as string) ?? '';
  const game = assets.games.rows[gameNumber - 1];
  const instructionAudioId = game?.instructionAudio;
  const hasInstruction =
    !!instructionAudioId && instructionAudioId in assets.audio.instructions;

  return (
    <GameShellContainer
      showInstructionsButton={hasInstruction}
      instructionAudioId={hasInstruction ? instructionAudioId : undefined}
      confirmOnBack={false}
    >
      <BrazilGame challengeLevel={challengeLevel} syllableGame={syllableGame} />
    </GameShellContainer>
  );
}
