import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Text, View } from 'react-native';
import { GameShellScreen } from './GameShellScreen';

const ICON = (seed: string) => ({ uri: `https://picsum.photos/seed/${seed}/64` });

const ICONS = {
  back: ICON('back'),
  instructions: ICON('inst'),
  advance: ICON('adv'),
  advanceInactive: ICON('adv-i'),
  trackerComplete: ICON('tc'),
  trackerIncomplete: ICON('ti'),
};

const FILLER = (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' }}>
    <Text style={{ fontSize: 24 }}>game body slot</Text>
  </View>
);

const trackers = (n: number): ('complete' | 'incomplete')[] =>
  Array.from({ length: 12 }, (_, i) => (i < n ? 'complete' : 'incomplete'));

const meta: Meta<typeof GameShellScreen> = {
  title: 'alphaTiles/feature-game-shell/GameShellScreen',
  component: GameShellScreen,
  args: {
    score: 12,
    gameNumber: 3,
    gameColor: '#1565C0',
    challengeLevel: 1,
    trackerCount: 4,
    trackerStates: trackers(4),
    interactionLocked: false,
    showInstructionsButton: true,
    advanceArrow: 'gray',
    showCelebration: false,
    backLabel: 'Back',
    replayLabel: 'Replay',
    instructionsLabel: 'Instructions',
    scoreLabel: 'Score',
    celebrationBackLabel: 'Back to menu',
    onBackPress: () => undefined,
    onReplayPress: () => undefined,
    onInstructionsPress: () => undefined,
    onAdvancePress: () => undefined,
    onCelebrationBack: () => undefined,
    icons: ICONS,
    children: FILLER,
  },
};

export default meta;
type Story = StoryObj<typeof GameShellScreen>;

export const Default: Story = {};

export const InteractionLocked: Story = {
  args: { interactionLocked: true },
};

export const AdvanceArrowBlue: Story = {
  args: {
    advanceArrow: 'blue',
    trackerCount: 5,
    trackerStates: trackers(5),
    score: 50,
  },
};

export const AdvanceArrowHidden: Story = {
  args: { advanceArrow: 'hidden' },
};

export const NoInstructions: Story = {
  args: { showInstructionsButton: false },
};

export const Celebration: Story = {
  args: {
    showCelebration: true,
    trackerCount: 12,
    trackerStates: trackers(12),
    score: 132,
  },
};
