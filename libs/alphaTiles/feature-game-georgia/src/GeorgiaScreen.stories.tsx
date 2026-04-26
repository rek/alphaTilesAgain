import type { Meta, StoryObj } from '@storybook/react';
import { GeorgiaScreen } from './GeorgiaScreen';
import type { GeorgiaChoice } from './GeorgiaScreen';

const IMG = { uri: 'https://picsum.photos/seed/georgia/300' };

const PALETTE = ['#1565C0', '#43A047', '#E53935', '#FB8C00', '#8E24AA'];

function makeChoices(
  texts: string[],
  grayedFlags: boolean[] = [],
): GeorgiaChoice[] {
  return texts.map((text, i) => ({
    text,
    grayed: grayedFlags[i] ?? false,
    bgColor: PALETTE[i % PALETTE.length],
  }));
}

const meta: Meta<typeof GeorgiaScreen> = {
  title: 'alphaTiles/feature-game-georgia/GeorgiaScreen',
  component: GeorgiaScreen,
  args: {
    wordImage: IMG,
    wordLabel: 'cat',
    revealedText: '',
    interactionLocked: false,
    onChoicePress: () => undefined,
    onImagePress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof GeorgiaScreen>;

/** CL1 — fresh round, 6 colored choices. */
export const Default: Story = {
  args: {
    gridShape: 6,
    choices: makeChoices(['c', 'k', 's', 'x', 't', 'd']),
  },
};

/** CL5 — mid-round, 12-tile grid. */
export const MidRound: Story = {
  args: {
    gridShape: 12,
    choices: makeChoices([
      'ca', 'ka', 'sa', 'ta',
      'co', 'ko', 'so', 'to',
      'cu', 'ku', 'su', 'tu',
    ]),
  },
};

/** Won state — 18-tile grid, correct revealed, others grayed. */
export const Won: Story = {
  args: {
    gridShape: 18,
    revealedText: 'cat',
    interactionLocked: true,
    choices: makeChoices(
      [
        'c', 'k', 's', 'x', 't', 'd',
        'b', 'f', 'g', 'h', 'l', 'm',
        'n', 'p', 'q', 'r', 'v', 'w',
      ],
      [
        false, true, true, true, true, true,
        true, true, true, true, true, true,
        true, true, true, true, true, true,
      ],
    ),
  },
};

/** Insufficient content / locked. */
export const InsufficientContent: Story = {
  args: {
    wordImage: undefined,
    wordLabel: '?',
    gridShape: 6,
    choices: [],
    interactionLocked: true,
  },
};
