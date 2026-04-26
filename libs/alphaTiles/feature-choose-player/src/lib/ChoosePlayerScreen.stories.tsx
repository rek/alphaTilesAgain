import type { Meta, StoryObj } from '@storybook/react';
import { ChoosePlayerScreen } from './ChoosePlayerScreen';
import type { PlayerCardData } from './ChoosePlayerScreen';

function makePlayer(
  id: string,
  name: string,
  avatar: number,
  deleteState: PlayerCardData['deleteState'] = 'idle',
): PlayerCardData {
  return { id, name, avatar, deleteState };
}

const meta: Meta<typeof ChoosePlayerScreen> = {
  title: 'alphaTiles/feature-choose-player/ChoosePlayerScreen',
  component: ChoosePlayerScreen,
  args: {
    heading: 'Choose your player',
    avatarCount: 12,
    addLabel: '+',
    onSelectPlayer: () => undefined,
    onAddPlayer: () => undefined,
    onRequestDelete: () => undefined,
    onConfirmDelete: () => undefined,
    a11y: {
      selectPlayer: (n) => `Select ${n}`,
      delete: 'Delete player',
      confirmDelete: 'Confirm delete',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChoosePlayerScreen>;

export const ThreePlayers: Story = {
  args: {
    players: [
      makePlayer('1', 'Anna', 0),
      makePlayer('2', 'Bilal', 3),
      makePlayer('3', 'Carmen', 7),
    ],
  },
};

export const Empty: Story = {
  args: { players: [] },
};

export const DeleteArmed: Story = {
  args: {
    players: [
      makePlayer('1', 'Anna', 0),
      makePlayer('2', 'Bilal', 3, 'armed'),
      makePlayer('3', 'Carmen', 7),
    ],
  },
};

export const DeleteConfirm: Story = {
  args: {
    players: [
      makePlayer('1', 'Anna', 0),
      makePlayer('2', 'Bilal', 3, 'confirm'),
      makePlayer('3', 'Carmen', 7),
    ],
  },
};
