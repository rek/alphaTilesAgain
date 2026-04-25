import type { Meta, StoryObj } from '@storybook/react';
import { BrazilScreen } from './BrazilScreen';
import type { BrazilScreenProps, ChoiceDisplay } from './BrazilScreen';

const COLORS = ['#E91E63', '#3F51B5', '#009688', '#FF9800', '#9C27B0'];

function makeChoice(text: string, i: number, overrides: Partial<ChoiceDisplay> = {}): ChoiceDisplay {
  return {
    text,
    visible: true,
    color: COLORS[i % COLORS.length],
    greyed: false,
    wrong: false,
    highlightCorrect: false,
    disabled: false,
    ...overrides,
  };
}

function fill(n: number): ChoiceDisplay[] {
  return Array.from({ length: 15 }, (_, i) =>
    i < n
      ? makeChoice(`tile${i}`, i)
      : { text: '', visible: false, color: '#000', greyed: false, wrong: false, highlightCorrect: false, disabled: true },
  );
}

const meta: Meta<typeof BrazilScreen> = {
  title: 'alphaTiles/feature-game-brazil/BrazilScreen',
  component: BrazilScreen,
  args: {
    onChoice: () => undefined,
    onWordImagePress: () => undefined,
    accessibilityChoiceLabels: Array.from({ length: 15 }, (_, i) => `choice ${i}`),
  },
};

export default meta;
type Story = StoryObj<typeof BrazilScreen>;

const baseDisplayTiles: BrazilScreenProps['displayTiles'] = [
  { text: 'c', isBlank: false },
  { text: '__', isBlank: true },
  { text: 't', isBlank: false },
];

export const CL1: Story = {
  args: {
    displayTiles: baseDisplayTiles,
    fullWord: 'cat',
    revealed: false,
    choices: ['a', 'e', 'i', 'o'].map((t, i) => makeChoice(t, i)),
    visibleChoiceCount: 4,
    wordImage: undefined,
    wordLabel: 'cat',
  },
};

export const CL3_Fifteen: Story = {
  args: {
    displayTiles: baseDisplayTiles,
    fullWord: 'cat',
    revealed: false,
    choices: fill(15),
    visibleChoiceCount: 15,
    wordImage: undefined,
    wordLabel: 'cat',
  },
};

export const CL7_TwoTones: Story = {
  args: {
    displayTiles: [
      { text: 'm', isBlank: false },
      { text: 'a', isBlank: false },
      { text: '◌', isBlank: true },
    ],
    fullWord: 'má',
    revealed: false,
    choices: [
      makeChoice('́', 0),
      makeChoice('̀', 1),
      ...fill(0).slice(2),
    ],
    visibleChoiceCount: 2,
    wordImage: undefined,
    wordLabel: 'má',
  },
};

export const SL1: Story = {
  args: {
    displayTiles: [
      { text: 'ka', isBlank: false },
      { text: '__', isBlank: true },
      { text: 'mu', isBlank: false },
    ],
    fullWord: 'kamamu',
    revealed: false,
    choices: ['ma', 'ka', 'ki', 'mu'].map((t, i) => makeChoice(t, i)),
    visibleChoiceCount: 4,
    wordImage: undefined,
    wordLabel: 'kamamu',
  },
};

export const Revealed: Story = {
  args: {
    displayTiles: baseDisplayTiles,
    fullWord: 'cat',
    revealed: true,
    choices: ['a', 'e', 'i', 'o'].map((t, i) =>
      makeChoice(t, i, t === 'a' ? { highlightCorrect: true } : { greyed: true, disabled: true }),
    ),
    visibleChoiceCount: 4,
    wordImage: undefined,
    wordLabel: 'cat',
  },
};
