/**
 * Storybook stories for UiPlayerCard — CSF 3.0.
 * Covers: idle, armed, confirm, long name.
 * See tasks.md §3.6.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { UiPlayerCard } from './UiPlayerCard';

const AVATAR_PLACEHOLDER = { uri: 'https://picsum.photos/seed/card/200' };

const meta: Meta<typeof UiPlayerCard> = {
  title: 'shared/ui-player-card/UiPlayerCard',
  component: UiPlayerCard,
  args: {
    avatar: AVATAR_PLACEHOLDER,
    name: 'Ada',
    deleteState: 'idle',
    onSelect: () => undefined,
    onRequestDelete: () => undefined,
    onDeletePress: () => undefined,
    a11y: {
      select: 'Select Ada',
      delete: 'Delete player',
      confirmDelete: 'Tap again to delete',
    },
  },
};

export default meta;
type Story = StoryObj<typeof UiPlayerCard>;

export const Idle: Story = {};

export const Armed: Story = {
  args: {
    deleteState: 'armed',
  },
};

export const Confirm: Story = {
  args: {
    deleteState: 'confirm',
  },
};

export const LongName: Story = {
  args: {
    name: 'Bartholomew Maximus III',
  },
};
