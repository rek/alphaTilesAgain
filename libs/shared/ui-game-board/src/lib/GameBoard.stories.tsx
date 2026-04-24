import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import { GameBoard } from './GameBoard';

const meta: Meta<typeof GameBoard> = {
  title: 'shared/ui-game-board/GameBoard',
  component: GameBoard,
};

export default meta;
type Story = StoryObj<typeof GameBoard>;

function Cell({ label }: { label: string }) {
  return (
    <View style={cell.root}>
      <Text style={cell.text}>{label}</Text>
    </View>
  );
}

const cell = StyleSheet.create({
  root: {
    width: 70,
    height: 70,
    backgroundColor: '#7B1FA2',
    borderRadius: 6,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#fff', fontWeight: 'bold' },
});

export const FourByFour: Story = {
  render: () => (
    <GameBoard columns={4} accessibilityLabel="4x4 game board">
      {Array.from({ length: 16 }, (_, i) => <Cell key={i} label={String(i + 1)} />)}
    </GameBoard>
  ),
};

export const TwoByThree: Story = {
  render: () => (
    <GameBoard columns={2} accessibilityLabel="2x3 game board">
      {Array.from({ length: 6 }, (_, i) => <Cell key={i} label={String(i + 1)} />)}
    </GameBoard>
  ),
};

export const OneByFourVertical: Story = {
  render: () => (
    <GameBoard columns={1} rows={4} accessibilityLabel="vertical strip">
      {Array.from({ length: 4 }, (_, i) => <Cell key={i} label={`Word ${i + 1}`} />)}
    </GameBoard>
  ),
};

export const AdaptiveRowCount: Story = {
  render: () => (
    <GameBoard columns={3} accessibilityLabel="adaptive 3-col board">
      {Array.from({ length: 6 }, (_, i) => <Cell key={i} label={String(i + 1)} />)}
    </GameBoard>
  ),
};
