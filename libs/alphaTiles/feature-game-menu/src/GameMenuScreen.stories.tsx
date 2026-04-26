import type { Meta, StoryObj } from '@storybook/react';
import { GameMenuScreen } from './GameMenuScreen';
import type { DoorItem } from '@shared/ui-door-grid';

const COLORS = ['#9C27B0', '#2196F3', '#F44336', '#4CAF50', '#E91E63', '#FFEB3B', '#FF9800', '#3F51B5'];

function makeDoors(n: number, visualForIdx: (i: number) => DoorItem['visual'] = () => 'not-started'): DoorItem[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    colorHex: COLORS[i % COLORS.length],
    visual: visualForIdx(i),
    a11yLabel: `Game ${i + 1}`,
  }));
}

const meta: Meta<typeof GameMenuScreen> = {
  title: 'alphaTiles/feature-game-menu/GameMenuScreen',
  component: GameMenuScreen,
  args: {
    page: 1,
    totalPages: 1,
    playerName: 'Anna',
    playerAvatarSrc: null,
    score: 42,
    showShare: true,
    showResources: true,
    showAbout: true,
    showAudioInstructions: true,
    layout: 'classic',
    onDoorPress: () => undefined,
    onPrev: () => undefined,
    onNext: () => undefined,
    onBack: () => undefined,
    onAbout: () => undefined,
    onShare: () => undefined,
    onResources: () => undefined,
    onAudioInstructions: () => undefined,
    onToggleLayout: () => undefined,
    a11y: {
      prev: 'Previous page',
      next: 'Next page',
      back: 'Back',
      about: 'About',
      share: 'Share',
      resources: 'Resources',
      audioInstructions: 'Audio instructions',
      score: 'Score',
      toggleLayout: 'Toggle layout',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GameMenuScreen>;

export const Default: Story = {
  args: { doors: makeDoors(12) },
};

export const WithProgress: Story = {
  args: {
    doors: makeDoors(12, (i) =>
      i < 3 ? 'mastery' : i < 6 ? 'in-process' : 'not-started',
    ),
    score: 240,
  },
};

export const Paged: Story = {
  args: {
    doors: makeDoors(12),
    page: 2,
    totalPages: 4,
  },
};

export const NoOptionalControls: Story = {
  args: {
    doors: makeDoors(12),
    showShare: false,
    showResources: false,
    showAbout: false,
    showAudioInstructions: false,
  },
};
