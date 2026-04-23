/**
 * In-memory AsyncStorage mock for Jest.
 * Zustand's persist middleware calls setItem/getItem/removeItem;
 * this mock satisfies the interface without native bridging.
 */
const store: Record<string, string> = {};

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => store[key] ?? null,
  setItem: async (key: string, value: string): Promise<void> => {
    store[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    delete store[key];
  },
  clear: async (): Promise<void> => {
    for (const k of Object.keys(store)) delete store[k];
  },
  getAllKeys: async (): Promise<string[]> => Object.keys(store),
  multiGet: async (keys: string[]): Promise<[string, string | null][]> =>
    keys.map((k) => [k, store[k] ?? null]),
  multiSet: async (pairs: [string, string][]): Promise<void> => {
    for (const [k, v] of pairs) store[k] = v;
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    for (const k of keys) delete store[k];
  },
  flushGetRequests: () => undefined,
};

export default AsyncStorage;
