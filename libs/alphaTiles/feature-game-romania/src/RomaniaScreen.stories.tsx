import type { Meta, StoryObj } from '@storybook/react';
import { RomaniaScreen } from './RomaniaScreen';

const meta: Meta<typeof RomaniaScreen> = {
  title: 'alphaTiles/feature-game-romania/RomaniaScreen',
  component: RomaniaScreen,
  args: {
    nextLabel: 'Next',
    prevLabel: 'Go To Previous',
    showPrev: false,
    onNext: () => undefined,
    onPrev: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof RomaniaScreen>;

export const BoldingOn: Story = {
  args: {
    focusTileText: 'a',
    focusTileBase: 'a',
    wordTiles: ['a', 'p', 'p', 'l', 'e'],
    wordLabel: 'apple',
    boldFocusTile: true,
  },
};

export const BoldingOff: Story = {
  args: {
    focusTileText: 'a',
    focusTileBase: 'a',
    wordTiles: ['a', 'p', 'p', 'l', 'e'],
    wordLabel: 'apple',
    boldFocusTile: false,
  },
};

export const LongWord: Story = {
  args: {
    focusTileText: 'a',
    focusTileBase: 'a',
    wordTiles: ['s', 't', 'r', 'a', 'w', 'b', 'e', 'r', 'r', 'y'],
    wordLabel: 'strawberry',
    boldFocusTile: true,
  },
};

export const ShortWord: Story = {
  args: {
    focusTileText: 'a',
    focusTileBase: 'a',
    wordTiles: ['a', 't'],
    wordLabel: 'at',
    boldFocusTile: true,
  },
};
