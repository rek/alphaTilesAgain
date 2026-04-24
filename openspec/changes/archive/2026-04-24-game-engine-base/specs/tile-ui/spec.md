## ADDED Requirements

### Requirement: Presentational tile component

`libs/shared/ui-tile` SHALL export a `<Tile>` component that renders either a text glyph or an image, in a tappable container with a configurable tint color. It accepts the tile's pre-translated text (or image source), the tint color, a pressed state, and an `onPress` handler. The component MUST be a pure props→JSX presenter — no hooks beyond `useState` for visual press feedback, no `useTranslation`, no data-access imports.

Props contract (ports `TileAdapter.ColorTile`'s shape):

```ts
type TileProps = {
  text?: string;
  imageSource?: ImageSourcePropType;
  color: string;            // hex or theme token
  fontColor?: string;       // hex or theme token; default white
  pressed?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
  accessibilityRole?: AccessibilityRole;
};
```

#### Scenario: Text tile

- **WHEN** `<Tile text="a" color="#9C27B0" accessibilityLabel="Tile a" onPress={fn} />` renders
- **THEN** a tappable container with the character `a` on a purple background and white text appears

#### Scenario: Image tile

- **WHEN** `<Tile imageSource={require('./cat.png')} color="transparent" accessibilityLabel="Word cat" />` renders
- **THEN** the image renders in place of text and the tile is tappable

#### Scenario: Pressed visual feedback

- **WHEN** the user presses the tile
- **THEN** the component applies a subtle darkening / scale effect until release (native-feeling press state)

#### Scenario: Accessibility contract

- **WHEN** `<Tile>` renders without `accessibilityLabel`
- **THEN** TypeScript refuses to compile (label is a required prop per ARCHITECTURE §11)

### Requirement: Variants

The library SHALL export two secondary variants:

- `<AudioButtonTile>` — overlays a speaker icon on top of the tile text; for "tap to hear the tile sound" contexts
- `<UpperCaseTile>` — renders the upper-case form of the tile (consumer provides it; the library does not compute case)

Both variants SHALL be thin wrappers around `<Tile>` that accept the same props plus variant-specific extras.

#### Scenario: Audio-button variant

- **WHEN** `<AudioButtonTile text="a" color="#2196F3" onPress={fn} accessibilityLabel="Play tile a" />` renders
- **THEN** a speaker icon appears overlaid in a corner of the tile

#### Scenario: Upper-case variant

- **WHEN** `<UpperCaseTile text="A" color="#F44336" accessibilityLabel="Tile A" />` renders
- **THEN** the tile renders text `A` exactly (upper-case is consumer-provided, not computed)

### Requirement: `type:ui` purity

`ui-tile` SHALL NOT import `react-i18next`, any Zustand store, any data-access lib, or any feature lib. Strings arrive as props. This is enforced by `@nx/enforce-module-boundaries` on the `type:ui` tag.

#### Scenario: i18n import audit

- **WHEN** `grep -r "react-i18next" libs/shared/ui-tile/` runs
- **THEN** zero matches

#### Scenario: Data-access import audit

- **WHEN** `nx graph` inspects `ui-tile`
- **THEN** no edge exists to any `type:data-access` or `type:feature` lib

### Requirement: Storybook documentation

The library SHALL ship Storybook stories for every variant and state: text tile, image tile, pressed tile, audio-button variant, upper-case variant, RTL layout. No mandatory unit tests per ADR-010 `type:ui` row.

#### Scenario: Story coverage

- **WHEN** Storybook is launched
- **THEN** the `ui-tile` section lists at least six stories covering the variants and states above
