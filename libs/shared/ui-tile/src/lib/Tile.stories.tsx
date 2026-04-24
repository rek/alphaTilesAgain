import type { Meta, StoryObj } from '@storybook/react';
import { AudioButtonTile } from './AudioButtonTile';
import type { AudioButtonTileProps } from './AudioButtonTile';
import { Tile } from './Tile';
import { UpperCaseTile } from './UpperCaseTile';
import type { UpperCaseTileProps } from './UpperCaseTile';

const meta: Meta<typeof Tile> = {
  title: 'shared/ui-tile/Tile',
  component: Tile,
  args: {
    accessibilityLabel: 'Tile',
    onPress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof Tile>;

export const TextTile: Story = {
  args: { text: 'a', color: '#9C27B0' },
};

export const ImageTile: Story = {
  args: {
    imageSource: { uri: 'https://picsum.photos/seed/word1/200' },
    color: 'transparent',
    accessibilityLabel: 'Word image',
  },
};

export const PressedTile: Story = {
  args: { text: 'b', color: '#2196F3', pressed: true },
};

export const RTLLayout: Story = {
  args: { text: 'א', color: '#4CAF50', accessibilityLabel: 'Hebrew tile alef' },
};

export const AudioButtonVariant: StoryObj<typeof AudioButtonTile> = {
  render: (args: AudioButtonTileProps) => <AudioButtonTile {...args} />,
  args: {
    text: 'a',
    color: '#2196F3',
    accessibilityLabel: 'Play tile a',
    onPress: () => undefined,
  },
};

export const UpperCaseVariant: StoryObj<typeof UpperCaseTile> = {
  render: (args: UpperCaseTileProps) => <UpperCaseTile {...args} />,
  args: {
    text: 'A',
    color: '#F44336',
    accessibilityLabel: 'Tile A',
    onPress: () => undefined,
  },
};
