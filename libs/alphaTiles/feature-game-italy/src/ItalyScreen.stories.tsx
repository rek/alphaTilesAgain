import type { Meta, StoryObj } from '@storybook/react';
import { ItalyScreen } from './ItalyScreen';
import type { ItalyBoardCell } from './ItalyScreen';

const COLORS = ['#C62828', '#2E7D32', '#1565C0', '#EF6C00', '#6A1B9A'];

function cell(text: string, idx: number, overrides: Partial<ItalyBoardCell> = {}): ItalyBoardCell {
  return {
    text,
    image: undefined,
    covered: false,
    loteria: false,
    textColor: COLORS[idx % 5],
    ...overrides,
  };
}

const WORDS = [
  'cat', 'dog', 'sun', 'fish',
  'bird', 'egg', 'tree', 'fox',
  'cow', 'bee', 'pig', 'rat',
  'ant', 'owl', 'bat', 'frog',
];

const FRESH_BOARD: ItalyBoardCell[] = WORDS.map((w, i) => cell(w, i));

const MID_GAME_BOARD: ItalyBoardCell[] = WORDS.map((w, i) =>
  cell(w, i, { covered: [1, 4, 7, 10].includes(i) }),
);

const ROW_WIN_BOARD: ItalyBoardCell[] = WORDS.map((w, i) =>
  cell(w, i, {
    covered: i < 4 || i === 8,
    loteria: i < 4,
  }),
);

const DIAGONAL_WIN_BOARD: ItalyBoardCell[] = WORDS.map((w, i) =>
  cell(w, i, {
    covered: [0, 5, 10, 15, 7].includes(i),
    loteria: [0, 5, 10, 15].includes(i),
  }),
);

const meta: Meta<typeof ItalyScreen> = {
  title: 'Games/Italy/ItalyScreen',
  component: ItalyScreen,
  args: {
    callerLabel: 'tap to repeat',
    onTilePress: () => undefined,
    onCallerPress: () => undefined,
  },
};
export default meta;

type Story = StoryObj<typeof ItalyScreen>;

export const FreshBoard: Story = {
  args: {
    board: FRESH_BOARD,
    currentCallText: 'cat',
    won: false,
    disabled: false,
  },
};

export const MidGame: Story = {
  args: {
    board: MID_GAME_BOARD,
    currentCallText: 'tree',
    won: false,
    disabled: false,
  },
};

export const RowWin: Story = {
  args: {
    board: ROW_WIN_BOARD,
    currentCallText: 'fish',
    won: true,
    disabled: false,
  },
};

export const DiagonalWin: Story = {
  args: {
    board: DIAGONAL_WIN_BOARD,
    currentCallText: 'frog',
    won: true,
    disabled: false,
  },
};

export const InsufficientContent: Story = {
  args: {
    board: [],
    currentCallText: '',
    won: false,
    disabled: true,
  },
};
