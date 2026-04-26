import type { Meta, StoryObj } from '@storybook/react';
import { LoadingScreen } from './LoadingScreen';

const meta: Meta<typeof LoadingScreen> = {
  title: 'alphaTiles/feature-loading/LoadingScreen',
  component: LoadingScreen,
  args: {
    phase: 'fonts',
    audioProgress: 0,
    error: null,
    labels: {
      title: 'Loading…',
      progress: 'Loading audio…',
      tapToBegin: 'Tap to begin',
      error: 'Something went wrong',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingScreen>;

export const Fonts: Story = { args: { phase: 'fonts' } };
export const I18n: Story = { args: { phase: 'i18n' } };
export const AudioMid: Story = { args: { phase: 'audio', audioProgress: 0.42 } };
export const AudioComplete: Story = { args: { phase: 'audio', audioProgress: 1 } };
export const Precompute: Story = { args: { phase: 'precompute' } };
export const TapToBegin: Story = {
  args: {
    phase: 'web-gate',
    onTapToBegin: () => undefined,
  },
};
export const ErrorState: Story = {
  args: {
    phase: 'fonts',
    error: new Error('Failed to load fonts: bundle missing'),
  },
};
