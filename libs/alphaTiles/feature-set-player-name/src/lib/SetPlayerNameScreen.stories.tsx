import type { Meta, StoryObj } from '@storybook/react';
import { SetPlayerNameScreen } from './SetPlayerNameScreen';

const ROMAN_KEYS = [
  ...'abcdefghijklmnopqrstuvwxyz'.split('').map((text) => ({ text, colorHex: '#1565C0' })),
];

const PLACEHOLDER_AVATARS = Array.from({ length: 12 }, (_, i) => i);

const meta: Meta<typeof SetPlayerNameScreen> = {
  title: 'alphaTiles/feature-set-player-name/SetPlayerNameScreen',
  component: SetPlayerNameScreen,
  args: {
    name: '',
    error: '',
    avatars: PLACEHOLDER_AVATARS,
    selectedAvatarIndex: 0,
    keys: ROMAN_KEYS,
    placeholder: 'Type your name',
    submitLabel: 'OK',
    cancelLabel: 'Cancel',
    onPickAvatar: () => undefined,
    onKey: () => undefined,
    onBackspace: () => undefined,
    onChangeText: () => undefined,
    onSubmit: () => undefined,
    onCancel: () => undefined,
    a11y: {
      avatarGrid: (i) => `Avatar ${i + 1}`,
      keyboardDelete: 'Delete',
      keyboardNext: 'Next',
      keyboardPrev: 'Previous',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SetPlayerNameScreen>;

export const Empty: Story = {};

export const PartiallyTyped: Story = {
  args: { name: 'Ann' },
};

export const WithError: Story = {
  args: {
    name: 'Ann',
    error: 'Name is already taken',
  },
};

export const FallbackTextInput: Story = {
  args: {
    name: 'Ann',
    keys: [], // empty keys → Screen falls back to TextInput
  },
};
