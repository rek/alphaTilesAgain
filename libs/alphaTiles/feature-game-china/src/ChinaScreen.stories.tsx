import type { Meta, StoryObj } from '@storybook/react';
import { ChinaScreen } from './ChinaScreen';
import type { ChinaScreenProps } from './ChinaScreen';

type CellColor = 'solved' | 'unsolved' | 'blank';

function allUnsolved(): CellColor[][] {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => 'unsolved' as CellColor),
  );
}

const WORD_IMAGES: ChinaScreenProps['wordImages'] = [
  { src: undefined, label: 'cat' },
  { src: undefined, label: 'dog' },
  { src: undefined, label: 'sun' },
  { src: undefined, label: 'cup' },
];

const BOARD_INITIAL = [
  'b', 'a', 't', 'c',
  'd', 'o', 'g', 's',
  'u', 'n', 'c', 'u',
  'p', 'x', '',  'z',
];

const meta: Meta<typeof ChinaScreen> = {
  title: 'alphaTiles/feature-game-china/ChinaScreen',
  component: ChinaScreen,
  args: {
    onTilePress: () => undefined,
    onImagePress: () => undefined,
    interactionLocked: false,
  },
};

export default meta;
type Story = StoryObj<typeof ChinaScreen>;

export const Initial: Story = {
  args: {
    board: BOARD_INITIAL,
    blankIndex: 14,
    rowColors: allUnsolved(),
    wordImages: WORD_IMAGES,
  },
};

export const Row0Solved: Story = {
  args: {
    board: ['b', 'a', 't', '',  'd', 'o', 'g', 's', 'u', 'n', 'c', 'u', 'p', 'x', 'y', 'z'],
    blankIndex: 3,
    rowColors: [
      ['solved', 'solved', 'solved', 'blank'],
      ['unsolved', 'unsolved', 'unsolved', 'unsolved'],
      ['unsolved', 'unsolved', 'unsolved', 'unsolved'],
      ['unsolved', 'unsolved', 'unsolved', 'unsolved'],
    ],
    wordImages: WORD_IMAGES,
  },
};

export const AllSolved: Story = {
  args: {
    board: ['b', 'a', 't', 'c',  'd', 'o', 'g', 's',  'u', 'n', 'c', 'u',  'p', '', 'y', 'z'],
    blankIndex: 13,
    rowColors: [
      ['solved', 'solved', 'solved', 'solved'],
      ['solved', 'solved', 'solved', 'solved'],
      ['solved', 'solved', 'solved', 'solved'],
      ['solved', 'blank', 'solved', 'solved'],
    ],
    wordImages: WORD_IMAGES,
  },
};

export const Locked: Story = {
  args: {
    board: BOARD_INITIAL,
    blankIndex: 14,
    rowColors: allUnsolved(),
    wordImages: WORD_IMAGES,
    interactionLocked: true,
  },
};
