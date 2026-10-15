import type { Meta, StoryObj } from '@storybook/react';
import { Celebration } from './Celebration';
import { celebrationAnimation } from './celebrationAnimation';

const meta: Meta<typeof Celebration> = {
  title: 'shared/ui-celebration/Celebration',
  component: Celebration,
  args: {
    animationSource: celebrationAnimation,
    backLabel: 'Back to Earth',
    onBackPress: () => undefined,
    onMount: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof Celebration>;

export const Default: Story = {};
