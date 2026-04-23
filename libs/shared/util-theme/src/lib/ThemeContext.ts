/**
 * React Context for the Theme object.
 * Exported for use by ThemeProvider and useTheme — not part of public API.
 *
 * See design.md §D4.
 */
import { createContext } from 'react';
import type { Theme } from './buildTheme';

export const ThemeContext = createContext<Theme | null>(null);
