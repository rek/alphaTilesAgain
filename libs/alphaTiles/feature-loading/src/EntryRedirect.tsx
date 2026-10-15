import React from 'react';
import { Redirect } from 'expo-router';
import { resolveEntryRoute } from './resolveEntryRoute';

/**
 * The `/` route. Mounts only after BootGate finished boot (players hydrated),
 * so the entry route reads settled player state.
 */
export function EntryRedirect(): React.JSX.Element {
  return <Redirect href={resolveEntryRoute()} />;
}
