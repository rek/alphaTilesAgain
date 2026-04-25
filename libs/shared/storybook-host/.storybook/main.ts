/**
 * Storybook composite host — "One Storybook For All" pattern.
 *
 * Framework: @storybook/react-native-web-vite (handles all RN→web aliasing
 * automatically — do NOT layer manual react-native-web aliases on top).
 *
 * Stories discovered from every lib in the workspace. Path aliases from
 * tsconfig.base.json resolved via nxViteTsPaths(). See design.md §D2–§D4, §D7.
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@storybook/react-native-web-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    {
      directory: '../../../shared/ui-avatar-grid/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../shared/ui-player-card/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../shared/ui-custom-keyboard/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../shared/ui-tile/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../shared/ui-game-board/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../shared/ui-score-bar/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../shared/ui-celebration/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../shared/ui-door/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../shared/ui-door-grid/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../alphaTiles/feature-game-china/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
    {
      directory: '../../../alphaTiles/feature-game-myanmar/src',
      files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    },
  ],
  addons: [],
  typescript: { reactDocgen: false },
  framework: getAbsolutePath('@storybook/react-native-web-vite'),
  viteFinal: async (config) =>
    mergeConfig(config, {
      plugins: [nxViteTsPaths()],
    }),
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
