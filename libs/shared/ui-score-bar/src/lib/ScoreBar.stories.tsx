import type { Meta, StoryObj } from '@storybook/react';
import { ScoreBar } from './ScoreBar';
import type { TrackerState } from './ScoreBar';

const COMPLETE = { uri: 'https://placehold.co/18x18/4CAF50/4CAF50' };
const INCOMPLETE = { uri: 'https://placehold.co/18x18/bdbdbd/bdbdbd' };

const meta: Meta<typeof ScoreBar> = {
  title: 'shared/ui-score-bar/ScoreBar',
  component: ScoreBar,
  args: {
    gameNumber: 88,
    gameColor: '#E91E63',
    challengeLevel: 1,
    score: 0,
    scoreLabel: 'pts',
    completeSource: COMPLETE,
    incompleteSource: INCOMPLETE,
  },
};

export default meta;
type Story = StoryObj<typeof ScoreBar>;

const all = (s: TrackerState): TrackerState[] => Array(12).fill(s);
const partial = (n: number): TrackerState[] =>
  Array(12).fill(null).map((_, i) => (i < n ? 'complete' : 'incomplete'));

export const ZeroTrackers: Story = {
  args: { trackerStates: all('incomplete') },
};

export const FiveTrackers: Story = {
  args: { trackerStates: partial(5), score: 12 },
};

export const TwelveTrackers: Story = {
  args: { trackerStates: all('complete'), score: 24 },
};

export const Mastered: Story = {
  args: { trackerStates: all('complete'), score: 48, challengeLevel: 3 },
};
