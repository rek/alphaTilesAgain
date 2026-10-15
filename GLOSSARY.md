# AlphaTiles

Literacy-game generator: a language community's asset pack becomes a set of tile-based games in that language.

## Language

**Door**:
One playable game instance on the menu: an `aa_games.txt` row (game class + challenge level + tile/syllable mode + stage) resolved against the pack, identified by its 1-based row position (`index`, the route `doorIndex`). Resolved only by `@alphaTiles/data-doors` (`doorsOf`).
_Avoid_: game row, game number, level (for the whole door)
