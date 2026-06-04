import type { Meta, StoryObj } from '@storybook/react';
import { useHanziWriter } from '@jamsch/react-native-hanzi-writer';
import { TaiwanScreen, type TaiwanScreenProps } from './TaiwanScreen';

const SAMPLE_CHAR = '醫';

function StoryHost(props: Omit<TaiwanScreenProps, 'writer'>) {
  const writer = useHanziWriter({
    character: SAMPLE_CHAR,
    loader: (char) =>
      fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`).then((r) => r.json()),
  });
  return <TaiwanScreen {...props} writer={writer} />;
}

const meta: Meta<typeof StoryHost> = {
  title: 'alphaTiles/feature-game-taiwan/TaiwanScreen',
  component: StoryHost,
  args: {
    progressLabel: 'Character 1 of 5',
    retryLabel: 'Retry',
    clearLabel: 'Clear',
    successLabel: '✓',
    success: false,
    onClear: () => undefined,
    loadingLabel: 'Loading…',
  },
};
export default meta;

type Story = StoryObj<typeof StoryHost>;

export const CL1_FullGuidance: Story = {
  name: 'CL1 — outline + character (default)',
  args: { outlineVisible: true, characterVisible: true },
};

export const CL2_OutlineOnly: Story = {
  name: 'CL2 — outline only',
  args: { outlineVisible: true, characterVisible: false },
};

export const CL3_OutlineStrict: Story = {
  name: 'CL3 — outline only, strict matching',
  args: { outlineVisible: true, characterVisible: false },
};

export const SuccessPause: Story = {
  name: 'Success pause (completed glyph, green)',
  args: { outlineVisible: true, characterVisible: true, success: true },
};
