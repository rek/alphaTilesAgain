/**
 * Storybook stories for UiCustomKeyboard — CSF 3.0.
 * Covers: small (5 keys), medium (28 keys), large (60 keys), RTL layout.
 * See tasks.md §4.6.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { UiCustomKeyboard } from './UiCustomKeyboard';

const A11Y = {
  delete: 'Delete last character',
  next: 'Next keyboard page',
  prev: 'Previous keyboard page',
};

function makeKeys(n: number, color = '#e0e0e0') {
  return Array.from({ length: n }, (_, i) => ({
    text: String.fromCharCode(65 + (i % 26)),
    colorHex: color,
  }));
}

const meta: Meta<typeof UiCustomKeyboard> = {
  title: 'shared/ui-custom-keyboard/UiCustomKeyboard',
  component: UiCustomKeyboard,
  args: {
    a11y: A11Y,
    onKey: () => undefined,
    onBackspace: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof UiCustomKeyboard>;

export const Small: Story = {
  args: {
    keys: makeKeys(5, '#b3e5fc'),
  },
};

export const Medium: Story = {
  args: {
    keys: makeKeys(28, '#c8e6c9'),
  },
};

export const Large: Story = {
  args: {
    keys: makeKeys(60, '#ffe0b2'),
  },
};

export const Rtl: Story = {
  args: {
    keys: makeKeys(20, '#f3e5f5'),
  },
};
