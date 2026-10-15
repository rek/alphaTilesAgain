import { createInkResetScheduler } from './inkResetScheduler';

describe('createInkResetScheduler', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fires onReset once after the delay', () => {
    const onReset = jest.fn();
    const s = createInkResetScheduler(500, onReset);
    s.schedule();
    jest.advanceTimersByTime(499);
    expect(onReset).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('debounces: a second schedule replaces the pending one', () => {
    const onReset = jest.fn();
    const s = createInkResetScheduler(500, onReset);
    s.schedule();
    jest.advanceTimersByTime(300);
    s.schedule();
    jest.advanceTimersByTime(300);
    expect(onReset).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('cancel prevents the reset', () => {
    const onReset = jest.fn();
    const s = createInkResetScheduler(500, onReset);
    s.schedule();
    s.cancel();
    jest.advanceTimersByTime(1000);
    expect(onReset).not.toHaveBeenCalled();
  });
});
