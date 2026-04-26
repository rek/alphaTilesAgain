import type { Meta, StoryObj } from '@storybook/react';
import { ColombiaScreen } from './ColombiaScreen';
import type { KeyTile } from './types';

const IMG = { uri: 'https://picsum.photos/seed/colombia/300' };

const PALETTE = ['#1565C0', '#43A047', '#E53935', '#FB8C00', '#9C27B0'];

function makeKeys(texts: string[]): KeyTile[] {
  return texts.map((text, i) => ({
    text,
    bgColor: PALETTE[i % PALETTE.length],
  }));
}

const meta: Meta<typeof ColombiaScreen> = {
  title: 'alphaTiles/feature-game-colombia/ColombiaScreen',
  component: ColombiaScreen,
  args: {
    wordImage: IMG,
    wordLabel: 'cat',
    interactionLocked: false,
    paginated: false,
    page: 1,
    totalScreens: 1,
    onDelete: () => undefined,
    onKeyPress: () => undefined,
    onPageChange: () => undefined,
    onImagePress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof ColombiaScreen>;

/** Idle: empty attempt, yellow background. */
export const Idle: Story = {
  args: {
    displayedText: '',
    status: 'yellow',
    keys: makeKeys(['c', 'a', 't']),
  },
};

/** Mid-build, on-track tiles → yellow. */
export const Yellow: Story = {
  args: {
    displayedText: 'ca',
    status: 'yellow',
    keys: makeKeys(['c', 'a', 't']),
  },
};

/** Wrong tile but text-prefix matches → orange. */
export const Orange: Story = {
  args: {
    displayedText: 'ca',
    status: 'orange',
    keys: makeKeys(['c', 'a', 't']),
  },
};

/** Off-track: gray. */
export const Gray: Story = {
  args: {
    displayedText: 'cx',
    status: 'gray',
    keys: makeKeys(['c', 'a', 't']),
  },
};

/** Win: green, locked. */
export const Win: Story = {
  args: {
    displayedText: 'cat',
    status: 'green',
    keys: makeKeys(['c', 'a', 't']),
    interactionLocked: true,
  },
};

/** Paginated keyboard (T-CL3 / T-CL4 with > 35 keys). */
export const Paginated: Story = {
  args: {
    displayedText: '',
    status: 'yellow',
    keys: makeKeys(
      Array.from({ length: 33 }, (_, i) => String.fromCharCode(97 + (i % 26))),
    ),
    paginated: true,
    page: 1,
    totalScreens: 3,
  },
};
