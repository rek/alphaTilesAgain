/** Mock for @shared/util-i18n in unit tests. */
export function useTranslation() {
  return {
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.version) return `Version ${String(opts.version)}`;
      return key;
    },
  };
}
