/** Mock for @shared/util-i18n in unit tests. */
export function useTranslation() {
  return {
    t: (key: string) => key,
  };
}
