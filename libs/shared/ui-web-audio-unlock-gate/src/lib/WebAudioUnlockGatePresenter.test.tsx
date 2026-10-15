import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { WebAudioUnlockGatePresenter } from './WebAudioUnlockGatePresenter';

function setup(props: Partial<Parameters<typeof WebAudioUnlockGatePresenter>[0]> = {}) {
  const onUnlock = jest.fn();
  const utils = render(
    <WebAudioUnlockGatePresenter
      isReady
      label="Tap to start"
      title="AlphaTiles"
      onUnlock={onUnlock}
      {...props}
    />,
  );
  return { onUnlock, ...utils };
}

describe('WebAudioUnlockGatePresenter', () => {
  it('shows the title and label', () => {
    const { getByText } = setup();
    expect(getByText('Tap to start')).toBeTruthy();
    expect(getByText('AlphaTiles')).toBeTruthy();
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
});
