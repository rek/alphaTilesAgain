/**
 * Jest manual mock for expo-updates.
 * Used by jest.config.ts moduleNameMapper when expo-updates is not installed.
 * Individual test files override specific methods via jest.mock() factory.
 */
export const isEnabled = true;
export const channel = 'eng';
export const updateId = 'mock-update-id';
export const checkForUpdateAsync = jest.fn();
export const fetchUpdateAsync = jest.fn();
export const reloadAsync = jest.fn();
