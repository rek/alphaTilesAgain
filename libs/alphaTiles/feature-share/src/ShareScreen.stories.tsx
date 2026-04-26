import type { Meta, StoryObj } from '@storybook/react';
import { ShareScreen } from './ShareScreen';

const meta: Meta<typeof ShareScreen> = {
  title: 'alphaTiles/feature-share/ShareScreen',
  component: ShareScreen,
  args: {
    onBack: () => undefined,
    available: true,
    url: 'https://alphatilesapps.org/play/eng',
    instructions: 'Scan this QR code to share this app',
    shareButtonLabel: 'Share via…',
    qrAltLabel: 'QR code linking to the app',
    unavailableMessage: 'Sharing not configured for this pack',
    onShareTap: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof ShareScreen>;

export const Available: Story = {};

export const Unavailable: Story = {
  args: {
    available: false,
    url: '',
  },
};
