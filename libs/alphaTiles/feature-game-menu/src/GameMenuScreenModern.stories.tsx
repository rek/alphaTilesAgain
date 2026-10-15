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
    guidance: {
      visible: false,
      onOpen: () => undefined,
      onClose: () => undefined,
      strings: {
        title: 'Where to start',
        intro: 'Games are grouped by level, from Level 0 (easiest) to Level 6. Each door shows its level.',
        bands: [
          { title: 'Levels 0–1 · Listen and explore', body: 'Tap tiles and words to hear them. Start here with a new reader.' },
          { title: 'Levels 2–3 · Match and recognise', body: 'Match sounds, pictures and written words. Start here if the learner already knows some words.' },
          { title: 'Levels 4–6 · Build and solve', body: 'Spell words, take them apart and solve word puzzles. For confident readers.' },
        ],
        tip: 'Move up a level when the learner gets most answers right. A tick on a door means it is mastered.',
        close: 'Close',
      },
    },
    a11y: {
      back: 'Back',
      about: 'About',
      share: 'Share',
      resources: 'Resources',
      audioInstructions: 'Audio instructions',
      settings: 'Settings',
      score: 'Score',
      toggleLayout: 'Toggle layout',
      howLevelsWork: 'How levels work',
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

/** Difficulty ladder (#52): doors grouped by tier, raw door numbers kept (yue shape). */
const LADDER: [number, number][] = [
  [26, 0], [27, 0], [28, 0], [1, 2], [2, 2], [9, 2], [12, 3], [15, 3], [6, 4], [20, 4], [23, 4], [24, 4],
];

export const Ladder: Story = {
  args: {
    allDoors: LADDER.map(([index, tier], i) => ({
      index,
      colorHex: COLORS[i % COLORS.length],
      visual: i < 3 ? 'in-process' : i === 3 ? 'mastery' : 'not-started',
      textColorHex: i < 3 ? '#000000' : undefined,
      levelLabel: `Level ${tier}`,
    })),
  },
};

/** The "Where to start" explainer, open. */
export const GuidanceOpen: Story = {
  args: {
    allDoors: Ladder.args?.allDoors,
    guidance: { ...meta.args?.guidance, visible: true } as GameMenuScreenModernProps['guidance'],
  },
};
