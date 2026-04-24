import type { Meta, StoryObj } from '@storybook/react';
import { UiDoorGrid } from '../UiDoorGrid';
import type { DoorItem } from '../UiDoorGrid';

function makeDoors(n: number, overrides?: Partial<DoorItem>[]): DoorItem[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i + 1,
    colorHex: '#2196F3',
    visual: 'not-started' as const,
    a11yLabel: `Door ${i + 1}`,
    ...overrides?.[i],
  }));
}

const meta: Meta<typeof UiDoorGrid> = {
  title: 'shared/ui-door-grid/UiDoorGrid',
  component: UiDoorGrid,
  args: {
    onDoorPress: () => undefined,
    onPrev: () => undefined,
    onNext: () => undefined,
    a11y: { prev: 'Previous page', next: 'Next page' },
  },
};

export default meta;
type Story = StoryObj<typeof UiDoorGrid>;

export const SinglePage: Story = {
  args: {
    doors: makeDoors(12),
    page: 0,
    totalPages: 1,
  },
};

export const FirstPage: Story = {
  args: {
    doors: makeDoors(20),
    page: 0,
    totalPages: 3,
  },
};

export const MiddlePage: Story = {
  args: {
    doors: makeDoors(20),
    page: 1,
    totalPages: 3,
  },
};

export const LastPage: Story = {
  args: {
    doors: makeDoors(20),
    page: 2,
    totalPages: 3,
  },
};

export const ManyDoors: Story = {
  args: {
    doors: makeDoors(50),
    page: 0,
    totalPages: 3,
  },
};

export const MixedVisuals: Story = {
  args: {
    doors: [
      { index: 1, colorHex: '#2196F3', visual: 'not-started', a11yLabel: 'Door 1' },
      { index: 2, colorHex: '#2196F3', visual: 'in-process', a11yLabel: 'Door 2' },
      { index: 3, colorHex: '#2196F3', visual: 'mastery', a11yLabel: 'Door 3' },
      { index: 4, colorHex: '#2196F3', visual: 'in-process', a11yLabel: 'Door 4' },
      { index: 5, colorHex: '#2196F3', visual: 'not-started', a11yLabel: 'Door 5' },
      { index: 6, colorHex: '#2196F3', visual: 'mastery', a11yLabel: 'Door 6' },
      { index: 7, colorHex: '#2196F3', visual: 'not-started', a11yLabel: 'Door 7' },
      { index: 8, colorHex: '#2196F3', visual: 'in-process', a11yLabel: 'Door 8' },
      { index: 9, colorHex: '#2196F3', visual: 'mastery', a11yLabel: 'Door 9' },
      { index: 10, colorHex: '#2196F3', visual: 'not-started', a11yLabel: 'Door 10' },
      { index: 11, colorHex: '#2196F3', visual: 'in-process', a11yLabel: 'Door 11' },
      { index: 12, colorHex: '#2196F3', visual: 'mastery', a11yLabel: 'Door 12' },
    ],
    page: 0,
    totalPages: 1,
  },
};
