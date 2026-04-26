import type { Meta, StoryObj } from '@storybook/react';
import { GameMenuScreenModern } from './GameMenuScreenModern';
import type { DoorData } from './useDoors';

const COLORS = ['#9C27B0', '#2196F3', '#F44336', '#4CAF50', '#E91E63', '#FFEB3B', '#FF9800', '#3F51B5'];
const CLASS_KEYS = ['china', 'mexico', 'peru', 'brazil', 'italy', 'japan', 'thailand', 'romania'];

function makeDoors(
  n: number,
  visualForIdx: (i: number) => DoorData['visual'] = () => 'not-started',
): DoorData[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    classKey: CLASS_KEYS[i % CLASS_KEYS.length],
    challengeLevel: (i % 3) + 1,
    colorHex: COLORS[i % COLORS.length],
    noRightWrong: false,
    trackerCount: i % 13,
    visual: visualForIdx(i),
    textColorHex: undefined,
  }));
}

const meta: Meta<typeof GameMenuScreenModern> = {
  title: 'alphaTiles/feature-game-menu/GameMenuScreenModern',
  component: GameMenuScreenModern,
  args: {
    playerName: 'Anna',
    playerAvatarSrc: null,
    score: 42,
    showShare: true,
    showResources: true,
    showAbout: true,
    showAudioInstructions: true,
    layout: 'modern',
    onDoorPress: () => undefined,
    onBack: () => undefined,
    onAbout: () => undefined,
    onShare: () => undefined,
    onResources: () => undefined,
    onAudioInstructions: () => undefined,
    onToggleLayout: () => undefined,
    a11y: {
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
type Story = StoryObj<typeof GameMenuScreenModern>;

export const Default: Story = {
  args: { allDoors: makeDoors(12) },
};

export const ManyDoors: Story = {
  args: { allDoors: makeDoors(40) },
};

export const Mixed: Story = {
  args: {
    allDoors: makeDoors(20, (i) =>
      i % 3 === 0 ? 'mastery' : i % 3 === 1 ? 'in-process' : 'not-started',
    ),
    score: 180,
  },
};
