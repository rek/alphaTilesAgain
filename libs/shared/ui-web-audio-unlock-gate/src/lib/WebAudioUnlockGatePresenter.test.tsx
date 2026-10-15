import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { WebAudioUnlockGatePresenter } from './WebAudioUnlockGatePresenter';

function setup(props: Partial<Parameters<typeof WebAudioUnlockGatePresenter>[0]> = {}) {
  const onUnlock = jest.fn();
  const utils = render(
    <WebAudioUnlockGatePresenter
      isLocked
      isReady
      label="Tap to start"
      title="AlphaTiles"
      onUnlock={onUnlock}
      {...props}
    >
      <Text>game content</Text>
    </WebAudioUnlockGatePresenter>,
  );
  return { onUnlock, ...utils };
}

describe('WebAudioUnlockGatePresenter', () => {
  it('shows the overlay and hides children while locked', () => {
    const { getByText, queryByText } = setup();
    expect(getByText('Tap to start')).toBeTruthy();
    expect(queryByText('game content')).toBeNull();
  });

  it('calls onUnlock when the overlay is pressed', () => {
    const { getByTestId, onUnlock } = setup();
    fireEvent.press(getByTestId('web-audio-unlock-gate'));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('ignores presses until ready (audio still loading)', () => {
    const { getByTestId, onUnlock, getByText } = setup({ isReady: false, label: 'Loading 40%' });
    fireEvent.press(getByTestId('web-audio-unlock-gate'));
    expect(onUnlock).not.toHaveBeenCalled();
    expect(getByText('Loading 40%')).toBeTruthy();
  });

  it('renders only children once unlocked', () => {
    const { queryByTestId, getByText } = setup({ isLocked: false });
    expect(queryByTestId('web-audio-unlock-gate')).toBeNull();
    expect(getByText('game content')).toBeTruthy();
  });
});
