import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { GameShellScreen } from './GameShellScreen';

function props(overrides: Partial<Parameters<typeof GameShellScreen>[0]> = {}) {
  return {
    score: 0,
    gameNumber: 9,
    gameColor: '#1565C0',
    challengeLevel: 1,
    trackerCount: 1,
    trackerStates: Array.from({ length: 12 }, (_, i) =>
      i < 1 ? ('complete' as const) : ('incomplete' as const),
    ),
    interactionLocked: false,
    chromeLocked: false,
    showInstructionsButton: true,
    advanceArrow: 'blue' as const,
    showCelebration: false,
    backLabel: 'Back',
    replayLabel: 'Replay',
    instructionsLabel: 'Instructions',
    scoreLabel: 'Score',
    celebrationBackLabel: 'Back to menu',
    a11yLabels: { advance: 'Next' },
    onBackPress: jest.fn(),
    onReplayPress: jest.fn(),
    onInstructionsPress: jest.fn(),
    onAdvancePress: jest.fn(),
    onCelebrationBack: jest.fn(),
    children: <Text>board</Text>,
    ...overrides,
  };
}

const CHROME = ['Back', 'Instructions', 'Replay', 'Next'];

describe('GameShellScreen chrome lock', () => {
  // U1: Georgia / Ecuador / Colombia lock the board after a correct answer
  // until the advance arrow starts the next round. The chrome row must not
  // obey that board lock, or the child is stuck on a solved round.
  it('board locked after a correct answer: chrome row (advance) stays usable', () => {
    const p = props({ interactionLocked: true });
    const { getByLabelText } = render(<GameShellScreen {...p} />);
    for (const label of CHROME) {
      expect(getByLabelText(label)).not.toBeDisabled();
    }
    fireEvent.press(getByLabelText('Next'));
    expect(p.onAdvancePress).toHaveBeenCalledTimes(1);
  });

  it('chrome locked (speech chain / pending mastery action): chrome row disabled', () => {
    const p = props({ chromeLocked: true });
    const { getByLabelText } = render(<GameShellScreen {...p} />);
    for (const label of CHROME) {
      expect(getByLabelText(label)).toBeDisabled();
    }
    fireEvent.press(getByLabelText('Next'));
    expect(p.onAdvancePress).not.toHaveBeenCalled();
  });
});

describe('GameShellScreen tablet layout', () => {
  it('phone (default): chrome row uncapped', () => {
    const { getByTestId } = render(<GameShellScreen {...props()} />);
    expect(getByTestId('game-shell-chrome-row')).not.toHaveStyle({ maxWidth: 500 });
  });

  it('tablet: chrome buttons gather in a centred 500dp row', () => {
    const { getByTestId } = render(<GameShellScreen {...props({ breakpoint: 'tablet' })} />);
    expect(getByTestId('game-shell-chrome-row')).toHaveStyle({
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
    });
  });

  it('tablet: board slot is NOT capped (games size from window width)', () => {
    const { getByText } = render(<GameShellScreen {...props({ breakpoint: 'tablet' })} />);
    let node = getByText('board').parent;
    while (node) {
      expect(StyleSheet.flatten(node.props.style)?.maxWidth).toBeUndefined();
      node = node.parent;
    }
  });

  it('tablet: chrome buttons still render and fire', () => {
    const p = props({ breakpoint: 'tablet' });
    const { getByLabelText } = render(<GameShellScreen {...p} />);
    fireEvent.press(getByLabelText('Next'));
    expect(p.onAdvancePress).toHaveBeenCalledTimes(1);
  });
});
