/**
 * Storybook stories for UiAvatarGrid — CSF 3.0.
 * Covers: 6 avatars, 12 avatars, with selection, with dimming.
 * See tasks.md §2.6.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { UiAvatarGrid } from './UiAvatarGrid';

// Remote URIs for Storybook — prod uses Metro require-ids from langManifest.images.avatars
const PLACEHOLDER_AVATARS = Array.from({ length: 12 }, (_, i) => ({
  uri: `https://picsum.photos/seed/avatar${i + 1}/200`,
}));

const meta: Meta<typeof UiAvatarGrid> = {
  title: 'shared/ui-avatar-grid/UiAvatarGrid',
  component: UiAvatarGrid,
  args: {
    a11yLabel: (i) => `Avatar ${i + 1}`,
    onPick: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof UiAvatarGrid>;

export const SixAvatars: Story = {
  args: {
    avatars: PLACEHOLDER_AVATARS.slice(0, 6),
  },
};

export const TwelveAvatars: Story = {
  args: {
    avatars: PLACEHOLDER_AVATARS,
  },
};

export const WithSelection: Story = {
  args: {
    avatars: PLACEHOLDER_AVATARS,
    selectedIndex: 3,
  },
};

export const WithDimming: Story = {
  args: {
    avatars: PLACEHOLDER_AVATARS,
    selectedIndex: 0,
    dimmedIndices: [2, 4, 7],
  },
};
