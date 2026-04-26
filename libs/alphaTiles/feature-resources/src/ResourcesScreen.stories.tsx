import type { Meta, StoryObj } from '@storybook/react';
import { ResourcesScreen } from './ResourcesScreen';

const meta: Meta<typeof ResourcesScreen> = {
  title: 'alphaTiles/feature-resources/ResourcesScreen',
  component: ResourcesScreen,
  args: {
    onBack: () => undefined,
    isEmpty: false,
    resources: [
      { name: 'Teacher guide (PDF)', link: 'https://example.org/guide.pdf', image: '' },
      { name: 'Reading primer', link: 'https://example.org/primer', image: '' },
      { name: 'Audio storybook', link: 'https://example.org/audio', image: '' },
      { name: 'Community website', link: 'https://example.org', image: '' },
    ],
    emptyMessage: 'No resources available',
    onResourceTap: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof ResourcesScreen>;

export const WithResources: Story = {};

export const Empty: Story = {
  args: {
    isEmpty: true,
    resources: [],
  },
};
