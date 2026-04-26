import type { Meta, StoryObj } from '@storybook/react';
import { MalaysiaScreen, type MalaysiaRow } from './MalaysiaScreen';
import { COLOR_INDEX_PYRAMID } from './rowColor';

// Storybook uses remote URIs (Metro require-id is only resolved in the app).
const IMG = (seed: string) => ({ uri: `https://picsum.photos/seed/${seed}/120` });
const ARROW = { uri: 'https://picsum.photos/seed/arrow/64' };

// Java pack default colorList — first 9 entries are enough for [0..8].
const PALETTE = [
  '#9C27B0', '#3F51B5', '#03A9F4', '#009688',
  '#8BC34A', '#FFEB3B', '#FF9800', '#F44336',
  '#9E9E9E',
];

const SAMPLE_WORDS = [
  'sun', 'moon', 'star', 'tree', 'fish', 'bird',
  'boat', 'fire', 'rain', 'leaf', 'rock',
];

function makeRow(text: string, idx: number, colorless = false): MalaysiaRow {
  const colorIdx = colorless ? 8 : COLOR_INDEX_PYRAMID[idx] ?? 0;
  return {
    id: text,
    text,
    bgColor: PALETTE[colorIdx],
    image: IMG(text),
  };
}

const FULL_PAGE: MalaysiaRow[] = SAMPLE_WORDS.map((w, i) => makeRow(w, i));

const PARTIAL_PAGE: MalaysiaRow[] = ['kite', 'lake', 'moon'].map((w, i) =>
  makeRow(w, i),
);

const meta: Meta<typeof MalaysiaScreen> = {
  title: 'alphaTiles/feature-game-malaysia/MalaysiaScreen',
  component: MalaysiaScreen,
  args: {
    prevArrowSource: ARROW,
    nextArrowSource: ARROW,
    disabled: false,
    rtl: false,
    onPress: () => undefined,
    onPrev: () => undefined,
    onNext: () => undefined,
  },
};
export default meta;
type Story = StoryObj<typeof MalaysiaScreen>;

/** Default: full 11-row first page of 3 pages. */
export const Default: Story = {
  args: {
    rows: FULL_PAGE,
    page: 0,
    pageCount: 3,
  },
};

/** Mid-page: both arrows visible. */
export const MidPage: Story = {
  args: {
    rows: FULL_PAGE,
    page: 1,
    pageCount: 3,
  },
};

/** Last page is partial; forward arrow hidden. */
export const LastPagePartial: Story = {
  args: {
    rows: PARTIAL_PAGE,
    page: 2,
    pageCount: 3,
  },
};

/** Single-page stage (numPages === 0). Both arrows hidden. */
export const InsufficientContent: Story = {
  args: {
    rows: [makeRow('only', 0)],
    page: 0,
    pageCount: 1,
  },
};

/** Audio in flight — all rows + arrows disabled. */
export const Disabled: Story = {
  args: {
    rows: FULL_PAGE,
    page: 0,
    pageCount: 3,
    disabled: true,
  },
};

/** Colorless mode — every row uses colorList[8]. */
export const Colorless: Story = {
  args: {
    rows: SAMPLE_WORDS.map((w, i) => makeRow(w, i, true)),
    page: 0,
    pageCount: 1,
  },
};

/** RTL — arrow images mirrored via scaleX: -1. */
export const RTL: Story = {
  args: {
    rows: FULL_PAGE,
    page: 1,
    pageCount: 3,
    rtl: true,
  },
};
