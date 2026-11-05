/**
 * localStorage access that never throws: private modes, disabled storage or a full quota
 * just mean nothing is remembered.
 */
export const storage = {
  /** Reads a key; null if missing or storage is unavailable. */
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  /** Writes a key; silently does nothing if storage is unavailable. */
  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // ignore
    }
  },
};
