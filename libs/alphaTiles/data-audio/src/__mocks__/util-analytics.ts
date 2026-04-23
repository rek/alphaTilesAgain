/**
 * Jest stub for @shared/util-analytics.
 * Individual tests can spy on or override these exports.
 */

export const track = jest.fn();
export const identify = jest.fn();
export const screen = jest.fn();
