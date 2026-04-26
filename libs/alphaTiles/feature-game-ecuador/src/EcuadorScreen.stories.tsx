import type { Meta, StoryObj } from '@storybook/react';
import { EcuadorScreen } from './EcuadorScreen';
import type { EcuadorTile } from './EcuadorScreen';

const IMG = { uri: 'https://picsum.photos/seed/ecuador/300' };

const PALETTE = ['#1565C0', '#43A047', '#E53935', '#FB8C00', '#8E24AA'];

const SAMPLE_LAYOUT: Pick<EcuadorTile, 'x' | 'y' | 'width' | 'height'>[] = [
  { x: 16, y: 220, width: 120, height: 30 },
  { x: 180, y: 230, width: 140, height: 35 },
  { x: 40, y: 290, width: 110, height: 28 },
  { x: 200, y: 300, width: 130, height: 32 },
  { x: 20, y: 360, width: 150, height: 38 },
  { x: 200, y: 370, width: 110, height: 28 },
  { x: 60, y: 430, width: 140, height: 35 },
  { x: 220, y: 440, width: 120, height: 30 },
];

function makeTiles(texts: string[], grayedFlags: boolean[] = []): EcuadorTile[] {
  return SAMPLE_LAYOUT.map((p, i) => ({
    ...p,
    text: texts[i] ?? '',
    bgColor: PALETTE[i % 5],
    grayed: grayedFlags[i] ?? false,
  }));
}

const meta: Meta<typeof EcuadorScreen> = {
  title: 'alphaTiles/feature-game-ecuador/EcuadorScreen',
  component: EcuadorScreen,
  args: {
    promptImage: IMG,
    promptLabel: 'cat',
    interactionLocked: false,
    onTilePress: () => undefined,
    onImagePress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof EcuadorScreen>;

/** Fresh round, 8 colored scatter tiles. */
export const Default: Story = {
  args: {
    tiles: makeTiles(['cat', 'kat', 'sat', 'xat', 'bat', 'rat', 'fat', 'mat']),
  },
};

/** Mid-round: correct tapped, 7 grayed (won state). */
export const MidRound: Story = {
  args: {
    interactionLocked: true,
    tiles: makeTiles(
      ['cat', 'kat', 'sat', 'xat', 'bat', 'rat', 'fat', 'mat'],
      [false, true, true, true, true, true, true, true],
    ),
  },
};

/** Insufficient content / locked. */
export const InsufficientContent: Story = {
  args: {
    promptImage: undefined,
    promptLabel: '?',
    tiles: [],
    interactionLocked: true,
  },
};
