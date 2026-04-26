import type { Meta, StoryObj } from '@storybook/react';
import { IraqScreen } from './IraqScreen';
import type { IraqTileView } from './IraqScreen';

const PALETTE = [
  '#1565C0', '#43A047', '#E53935', '#FB8C00', '#8E24AA', '#00897B', '#3949AB',
];

const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHI'.split('');

function makeTiles(letters: string[]): IraqTileView[] {
  return letters.map((text, i) => ({ text, bgColor: PALETTE[i % PALETTE.length] }));
}

const FULL_PAGE: IraqTileView[] = makeTiles(ALPHA.slice(0, 35));
const PARTIAL_PAGE: IraqTileView[] = makeTiles(ALPHA.slice(0, 9));

const meta: Meta<typeof IraqScreen> = {
  title: 'alphaTiles/feature-game-iraq/IraqScreen',
  component: IraqScreen,
  args: {
    interactionLocked: false,
    rtl: false,
    onTilePress: () => undefined,
    onPrev: () => undefined,
    onNext: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof IraqScreen>;

/** First page of a 3-page list — prev hidden, next visible. */
export const Default: Story = {
  args: {
    tilesOnPage: FULL_PAGE,
    overlay: null,
    page: 0,
    pageCount: 3,
  },
};

/** Mid-page — both arrows visible, no overlay. */
export const MidPage: Story = {
  args: {
    tilesOnPage: FULL_PAGE,
    overlay: null,
    page: 1,
    pageCount: 3,
  },
};

/** Last page partial fill — next hidden. */
export const LastPagePartial: Story = {
  args: {
    tilesOnPage: PARTIAL_PAGE,
    overlay: null,
    page: 2,
    pageCount: 3,
  },
};

/** Tile-tap overlay active on tile index 4 — white background, word + image. */
export const OverlayActive: Story = {
  args: {
    tilesOnPage: FULL_PAGE,
    overlay: {
      tileIndex: 4,
      wordText: 'cat',
      wordImage: { uri: 'https://picsum.photos/seed/cat/120' },
    },
    page: 0,
    pageCount: 3,
    interactionLocked: true,
  },
};

/** Insufficient content — totally empty page. */
export const InsufficientContent: Story = {
  args: {
    tilesOnPage: [],
    overlay: null,
    page: 0,
    pageCount: 1,
  },
};

/** RTL layout — arrows mirrored. */
export const RTL: Story = {
  args: {
    tilesOnPage: FULL_PAGE,
    overlay: null,
    page: 1,
    pageCount: 3,
    rtl: true,
  },
};
