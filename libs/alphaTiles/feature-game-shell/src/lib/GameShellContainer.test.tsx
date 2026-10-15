/**
 * Shell wiring through its interface: a mechanic child answers via
 * useGameShell(); door progress (mocked at its hook) returns the mastery
 * action; the shell performs it (GameActivity.java:319-412) and keeps the
 * chrome row usable while the board is locked (U1).
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  back: jest.fn(),
  replace: jest.fn(),
  dismissTo: jest.fn(),
  canGoBack: jest.fn(() => true),
};
jest.mock('expo-router', () => ({
  Redirect: () => null,
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ doorIndex: '1' }),
}));

const mockDoor = {
  index: 1,
  classKey: 'georgia',
  colorHex: '#123456',
  displayLevel: 1,
  instructionAudio: undefined,
  enabled: true,
  progressKey: (p: string) => `Georgia1${p}1`,
};
const mockNextDoor = { ...mockDoor, index: 2, classKey: 'thailand', challengeLevel: 101 };
jest.mock('@alphaTiles/data-doors', () => ({ useDoor: () => mockDoor }));

let mockMasteryAction: string | null = null;
const mockRecordCorrect = jest.fn(() => mockMasteryAction);
jest.mock('@alphaTiles/data-door-progress', () => ({
  useDoorProgress: () => ({
    points: 0,
    trackerCount: 0,
    trackers: Array(12).fill(false),
    recordCorrect: mockRecordCorrect,
    nextDoor: () => mockNextDoor,
  }),
}));

const mockAudio = { playCorrectFinal: jest.fn(), playCorrect: jest.fn(), playIncorrect: jest.fn() };
jest.mock('@alphaTiles/data-audio', () => ({
  useAudio: () => mockAudio,
  usePackSpeech: () => ({ speak: jest.fn(), durationOf: jest.fn(), stop: jest.fn() }),
}));
jest.mock('@alphaTiles/data-language-assets', () => ({
  useLangAssets: () => ({ words: { rows: [] }, syllables: { rows: [] } }),
}));
jest.mock('@alphaTiles/data-players', () => ({ useActivePlayer: () => ({ id: 'p1' }) }));
jest.mock('@alphaTiles/data-settings', () => ({
  useEffectiveSettings: () => ({ changeArrowColors: false }),
}));
jest.mock('@shared/util-i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@shared/ui-celebration', () => ({
  Celebration: () =>
    jest.requireActual('react').createElement(jest.requireActual('react-native').Text, null, 'celebration'),
  celebrationAnimation: {},
}));

import { GameShellContainer } from './GameShellContainer';
import { useGameShell } from './GameShellContext';
import { useShellAdvance } from './useShellAdvance';

/** Minimal mechanic: correct answer locks the board until advance (Georgia). */
function Mechanic({ onAdvance }: { onAdvance: () => void }) {
  const shell = useGameShell();
  useShellAdvance(() => {
    shell.setInteractionLocked(false);
    onAdvance();
  });
  return (
    <Pressable
      accessibilityLabel="answer"
      onPress={() => {
        shell.setInteractionLocked(true);
        shell.incrementPointsAndTracker(true);
      }}
    >
      <Text>{shell.interactionLocked ? 'locked' : 'open'}</Text>
    </Pressable>
  );
}

function setup(action: string | null) {
  mockMasteryAction = action;
  const onAdvance = jest.fn();
  const r = render(
    <GameShellContainer>
      <Mechanic onAdvance={onAdvance} />
    </GameShellContainer>,
  );
  return { ...r, onAdvance };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

describe('GameShellContainer', () => {
  it('U1: board locked after a correct answer, advance arrow still works', () => {
    const { getByLabelText, getByText, onAdvance } = setup(null);
    fireEvent.press(getByLabelText('answer'));
    expect(getByText('locked')).toBeTruthy();
    expect(getByLabelText('a11y.advance')).not.toBeDisabled();
    fireEvent.press(getByLabelText('a11y.advance'));
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(getByText('open')).toBeTruthy();
  });

  it('records the correct answer through mockDoor progress', () => {
    const { getByLabelText } = setup(null);
    fireEvent.press(getByLabelText('answer'));
    expect(mockRecordCorrect).toHaveBeenCalledWith(1);
  });

  it('keep-playing: no navigation, chrome stays usable', () => {
    const { getByLabelText } = setup('keep-playing');
    fireEvent.press(getByLabelText('answer'));
    act(() => jest.advanceTimersByTime(10_000));
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(getByLabelText('a11y.advance')).not.toBeDisabled();
  });

  it('return-to-menu: chrome locked, menu after the correct chime', () => {
    const { getByLabelText } = setup('return-to-menu');
    fireEvent.press(getByLabelText('answer'));
    expect(getByLabelText('a11y.advance')).toBeDisabled();
    act(() => jest.advanceTimersByTime(799));
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/menu');
  });

  it('celebrate-then-next-door: celebration, final chime, then the next door', () => {
    const { getByLabelText, queryByText } = setup('celebrate-then-next-door');
    fireEvent.press(getByLabelText('answer'));
    expect(getByLabelText('a11y.advance')).toBeDisabled();
    act(() => jest.advanceTimersByTime(800 + 1800));
    expect(mockAudio.playCorrectFinal).toHaveBeenCalledTimes(1);
    expect(queryByText('celebration')).toBeTruthy();
    act(() => jest.advanceTimersByTime(4500 - 2600));
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/games/[classKey]',
      params: expect.objectContaining({ classKey: 'thailand', doorIndex: '2' }),
    });
  });
});
