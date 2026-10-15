import type { Meta, StoryObj } from '@storybook/react';
import { GameMenuScreenModern } from './GameMenuScreenModern';
import type { GameMenuScreenModernProps } from './GameMenuScreenModern';

type DoorData = GameMenuScreenModernProps['allDoors'][number];

const COLORS = ['#9C27B0', '#2196F3', '#F44336', '#4CAF50', '#E91E63', '#FFEB3B', '#FF9800', '#3F51B5'];

function makeDoors(
  n: number,
  visualForIdx: (i: number) => DoorData['visual'] = () => 'not-started',
): DoorData[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    colorHex: COLORS[i % COLORS.length],
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
    onSettings: () => undefined,
    onToggleLayout: () => undefined,
    a11y: {
      back: 'Back',
      about: 'About',
      share: 'Share',
      resources: 'Resources',
      audioInstructions: 'Audio instructions',
      settings: 'Settings',
      score: 'Score',
      toggleLayout: 'Toggle layout',
    },
    tabLabels: {
      about: 'About',
      share: 'Share',
      resources: 'Library',
      audioInstructions: 'Listen',
      settings: 'Settings',
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

/** Doors labelled from the pack's GameName column (#37); door 3 has no name. */
export const Named: Story = {
  args: {
    allDoors: makeDoors(9).map((d, i) => ({
      ...d,
      name: i === 2 ? undefined : ['聽字揀圖', '寫字', '揀第一個字', '記憶配對', '搵字', '砌字', '賓果', '詞語'][i % 8],
    })),
  },
};
