/** Mock for @alphaTiles/data-language-assets in unit tests. */
export function useLangAssets() {
  return {
    langInfo: {
      find: (key: string) => {
        const map: Record<string, string> = {
          'Lang Name (In Local Lang)': 'English',
          'Lang Name (In English)': 'English',
          Country: 'USA',
          'Audio and image credits': 'Some credits',
          'Audio and image credits (lang 2)': 'none',
          Email: 'test@example.com',
          'Privacy Policy': 'https://example.com/privacy',
        };
        return map[key];
      },
    },
  };
}
