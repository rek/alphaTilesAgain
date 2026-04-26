import type { Meta, StoryObj } from '@storybook/react';
import { ThailandScreen } from './ThailandScreen';
import type { ThailandScreenProps } from './ThailandScreen';

const FOUR_TEXT_CHOICES: ThailandScreenProps['choices'] = [
  { type: 'text', text: 'ba' },
  { type: 'text', text: 'ta' },
  { type: 'text', text: 'da' },
  { type: 'text', text: 'ka' },
];

const FOUR_IMAGE_CHOICES: ThailandScreenProps['choices'] = [
  { type: 'image', imageSource: undefined, wordLabel: 'cat' },
  { type: 'image', imageSource: undefined, wordLabel: 'dog' },
  { type: 'image', imageSource: undefined, wordLabel: 'hat' },
  { type: 'image', imageSource: undefined, wordLabel: 'sun' },
];

const CHOICE_LABELS: ThailandScreenProps['accessibilityChoiceLabels'] = ['ba', 'ta', 'da', 'ka'];
const IMAGE_CHOICE_LABELS: ThailandScreenProps['accessibilityChoiceLabels'] = ['cat', 'dog', 'hat', 'sun'];

const meta: Meta<typeof ThailandScreen> = {
  title: 'alphaTiles/feature-game-thailand/ThailandScreen',
  component: ThailandScreen,
  args: {
    onChoicePress: () => undefined,
    onRefPress: () => undefined,
    interactionLocked: false,
    correctIndex: null,
  },
};

export default meta;
type Story = StoryObj<typeof ThailandScreen>;

export const TileLowerRefTileLowerChoices: Story = {
  name: 'TILE_LOWER ref → TILE_LOWER choices',
  args: {
    refDisplay: { type: 'text', text: 'ba', backgroundColor: '#1565C0', textColor: '#FFFFFF' },
    choices: FOUR_TEXT_CHOICES,
    accessibilityRefLabel: 'ba',
    accessibilityChoiceLabels: CHOICE_LABELS,
  },
};

export const WordImageRefWordTextChoices: Story = {
  name: 'WORD_IMAGE ref → WORD_TEXT choices',
  args: {
    refDisplay: { type: 'image', imageSource: undefined, wordLabel: 'apple' },
    choices: [
      { type: 'text', text: 'apple' },
      { type: 'text', text: 'banana' },
      { type: 'text', text: 'cherry' },
      { type: 'text', text: 'grape' },
    ],
    accessibilityRefLabel: 'apple',
    accessibilityChoiceLabels: ['apple', 'banana', 'cherry', 'grape'],
  },
};

export const TileAudioRefTileLowerChoices: Story = {
  name: 'TILE_AUDIO ref (audio icon) → TILE_LOWER choices',
  args: {
    refDisplay: { type: 'audio', refType: 'TILE_AUDIO' },
    choices: FOUR_TEXT_CHOICES,
    accessibilityRefLabel: 'play audio',
    accessibilityChoiceLabels: CHOICE_LABELS,
  },
};

export const CorrectSelected: Story = {
  name: 'Correct choice selected (highlighted)',
  args: {
    refDisplay: { type: 'text', text: 'ba', backgroundColor: '#1565C0', textColor: '#FFFFFF' },
    choices: FOUR_TEXT_CHOICES,
    correctIndex: 0,
    choiceFeedback: [
      { backgroundColor: '#1565C0', textColor: '#FFFFFF' },
      null,
      null,
      null,
    ],
    interactionLocked: true,
    accessibilityRefLabel: 'ba',
    accessibilityChoiceLabels: CHOICE_LABELS,
  },
};

export const WordImageChoices: Story = {
  name: 'WORD_IMAGE choices',
  args: {
    refDisplay: { type: 'audio', refType: 'WORD_AUDIO' },
    choices: FOUR_IMAGE_CHOICES,
    accessibilityRefLabel: 'play word audio',
    accessibilityChoiceLabels: IMAGE_CHOICE_LABELS,
  },
};
