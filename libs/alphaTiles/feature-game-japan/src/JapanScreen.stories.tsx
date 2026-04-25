import type { Meta, StoryObj } from '@storybook/react';
import { JapanScreen } from './JapanScreen';
import type { JapanScreenProps } from './JapanScreen';

const noop = () => undefined;

const meta: Meta<typeof JapanScreen> = {
  title: 'alphaTiles/feature-game-japan/JapanScreen',
  component: JapanScreen,
  args: {
    onJoin: noop,
    onSeparate: noop,
    wordText: 'banana',
    wordImage: undefined,
  },
};

export default meta;
type Story = StoryObj<typeof JapanScreen>;

/** 3-tile word — all tiles separate, all link buttons visible */
export const ThreeTileInitial: Story = {
  name: '3-tile word (initial)',
  args: {
    wordText: 'ban',
    groups: [
      { tiles: ['b'], isLocked: false },
      { tiles: ['a'], isLocked: false },
      { tiles: ['n'], isLocked: false },
    ],
    boundaries: [
      { index: 0, visible: true },
      { index: 1, visible: true },
    ],
  } satisfies Partial<JapanScreenProps>,
};

/** 7-tile word — initial state, all link buttons visible */
export const SevenTileInitial: Story = {
  name: '7-tile word (initial)',
  args: {
    wordText: 'ba-na-na',
    groups: [
      { tiles: ['b'], isLocked: false },
      { tiles: ['a'], isLocked: false },
      { tiles: ['n'], isLocked: false },
      { tiles: ['a'], isLocked: false },
      { tiles: ['n'], isLocked: false },
      { tiles: ['a'], isLocked: false },
      { tiles: ['s'], isLocked: false },
    ],
    boundaries: [
      { index: 0, visible: true },
      { index: 1, visible: true },
      { index: 2, visible: true },
      { index: 3, visible: true },
      { index: 4, visible: true },
      { index: 5, visible: true },
    ],
  } satisfies Partial<JapanScreenProps>,
};

/** Partial correct — first syllable locked GREEN, others still free */
export const PartialGreen: Story = {
  name: 'Partial GREEN (first syllable correct)',
  args: {
    wordText: 'banana',
    groups: [
      { tiles: ['ba'], isLocked: true },
      { tiles: ['na'], isLocked: false },
      { tiles: ['na'], isLocked: false },
    ],
    boundaries: [
      { index: 0, visible: false },
      { index: 1, visible: true },
    ],
  } satisfies Partial<JapanScreenProps>,
};

/** Fully won — all groups locked GREEN */
export const FullyWon: Story = {
  name: 'Fully won (all GREEN)',
  args: {
    wordText: 'banana',
    groups: [
      { tiles: ['ba'], isLocked: true },
      { tiles: ['na', 'na'], isLocked: true },
    ],
    boundaries: [
      { index: 0, visible: false },
    ],
  } satisfies Partial<JapanScreenProps>,
};
