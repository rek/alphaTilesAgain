/**
 * Stub for expo-modules-core in Storybook / Vite context.
 * Provides no-op implementations of the APIs used transitively
 * by expo-constants → requireOptionalNativeModule, CodedError.
 */
export class CodedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function requireOptionalNativeModule() {
  return null;
}

export function requireNativeModule() {
  return null;
}

export function NativeModule() {
  // stub — native modules are unavailable in browser context
}

export const EventEmitter = {};

export default {
  CodedError,
  requireOptionalNativeModule,
  requireNativeModule,
};
