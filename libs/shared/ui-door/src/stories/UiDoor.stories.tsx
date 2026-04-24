import type { Meta, StoryObj } from '@storybook/react';
import { UiDoor } from '../UiDoor';

const meta: Meta<typeof UiDoor> = {
  title: 'shared/ui-door/UiDoor',
  component: UiDoor,
  args: {
    onPress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof UiDoor>;

export const NotStarted: Story = {
  args: {
    visual: 'not-started',
    colorHex: '#2196F3',
    index: 1,
    a11yLabel: 'Door 1',
  },
};

export const InProcess: Story = {
  args: {
    visual: 'in-process',
    colorHex: '#2196F3',
    index: 2,
    a11yLabel: 'Door 2',
  },
};

export const Mastery: Story = {
  args: {
    visual: 'mastery',
    colorHex: '#2196F3',
    index: 3,
    a11yLabel: 'Door 3',
  },
};

export const NoRightWrong: Story = {
  args: {
    visual: 'in-process',
    colorHex: '#4CAF50',
    textColorHex: '#000000',
    index: 4,
    a11yLabel: 'Door 4',
  },
};

export const RedTint: Story = {
  args: {
    visual: 'not-started',
    colorHex: '#F44336',
    index: 5,
    a11yLabel: 'Door 5',
  },
};

export const LargeSize: Story = {
  args: {
    visual: 'in-process',
    colorHex: '#9C27B0',
    index: 88,
    width: 96,
    height: 132,
    a11yLabel: 'Door 88',
  },
};
