import type { Meta, StoryObj } from '@storybook/react';
import { PeruScreen } from './PeruScreen';
import type { PeruChoice } from './PeruScreen';

const IMG = { uri: 'https://picsum.photos/seed/peru/300' };

const PALETTE = ['#1565C0', '#43A047', '#E53935', '#FB8C00'];

function makeChoices(texts: string[], grayedFlags: boolean[] = []): PeruChoice[] {
  return texts.map((text, i) => ({
    text,
    grayed: grayedFlags[i] ?? false,
    bgColor: PALETTE[i % PALETTE.length],
  }));
}

const meta: Meta<typeof PeruScreen> = {
  title: 'alphaTiles/feature-game-peru/PeruScreen',
  component: PeruScreen,
  args: {
    wordImage: IMG,
    wordLabel: 'cat',
    interactionLocked: false,
    onChoicePress: () => undefined,
    onImagePress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof PeruScreen>;

/** Fresh round, 4 colored choices. */
export const Default: Story = {
  args: {
    choices: makeChoices(['cat', 'kat', 'sat', 'xat']),
  },
};

/** Mid-round: player tapped wrong choices repeatedly; correct found, 3 grayed. */
export const Won: Story = {
  args: {
    choices: makeChoices(['cat', 'kat', 'sat', 'xat'], [false, true, true, true]),
  },
};

/** Insufficient content / locked. */
export const InsufficientContent: Story = {
  args: {
    wordImage: undefined,
    wordLabel: '?',
    choices: [],
    interactionLocked: true,
  },
};
