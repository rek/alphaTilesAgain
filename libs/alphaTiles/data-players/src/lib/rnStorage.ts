/**
 * Shared AsyncStorage driver for Zustand persist middleware.
 * Per ADR-005: one driver, one code path, native + web.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const rnStorage = createJSONStorage(() => AsyncStorage);
