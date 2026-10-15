import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useMountEffect } from './useMountEffect';

function Probe({ label, onMount, onUnmount }: {
  label: string;
  onMount: (label: string) => void;
  onUnmount: () => void;
}) {
  useMountEffect(() => {
    onMount(label);
    return onUnmount;
  });
  return <Text>{label}</Text>;
}

describe('useMountEffect', () => {
  it('runs once on mount (not on re-render) and cleans up on unmount', () => {
    const onMount = jest.fn();
    const onUnmount = jest.fn();
    const r = render(<Probe label="a" onMount={onMount} onUnmount={onUnmount} />);
    r.rerender(<Probe label="b" onMount={onMount} onUnmount={onUnmount} />);
    expect(onMount).toHaveBeenCalledTimes(1);
    expect(onMount).toHaveBeenCalledWith('a');
    expect(onUnmount).not.toHaveBeenCalled();
    r.unmount();
    expect(onUnmount).toHaveBeenCalledTimes(1);
  });
});
