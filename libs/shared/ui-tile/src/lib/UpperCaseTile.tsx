import React from 'react';
import { Tile } from './Tile';
import type { TileProps } from './Tile';

// Consumer provides the upper-case text; this component does not compute case.
export type UpperCaseTileProps = TileProps;

export function UpperCaseTile(props: UpperCaseTileProps): React.JSX.Element {
  return <Tile {...props} />;
}
