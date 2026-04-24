import type { Meta, StoryObj } from '@storybook/react';
import { Celebration } from './Celebration';

// Use a remote Lottie JSON in Storybook — prod uses the bundled asset.
const LOTTIE_URI = { uri: 'https://assets10.lottiefiles.com/packages/lf20_jR229r.json' };

const meta: Meta<typeof Celebration> = {
  title: 'shared/ui-celebration/Celebration',
  component: Celebration,
  args: {
    animationSource: LOTTIE_URI,
    backLabel: 'Back to Earth',
    onBackPress: () => undefined,
    onMount: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof Celebration>;

export const Default: Story = {};
