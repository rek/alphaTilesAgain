## ADDED Requirements

### Requirement: Chrome buttons render icon images when assets provided

`GameShellScreen` SHALL accept an optional `icons` prop of type `GameShellIcons`. When provided, the back, instructions, and advance/replay `<Pressable>` elements SHALL render `<Image>` from the corresponding icon source instead of `<Text>`. The existing label props (`backLabel`, `instructionsLabel`, `replayLabel`) SHALL be used as `accessibilityLabel` on their respective `<Pressable>` elements rather than rendered as visible text.

```ts
type GameShellIcons = {
  back?: ImageSourcePropType;
  instructions?: ImageSourcePropType;
  advance?: ImageSourcePropType;
  advanceInactive?: ImageSourcePropType;
};
```

#### Scenario: Back button renders icon

- **WHEN** `icons.back` is provided
- **THEN** the back button renders `<Image source={icons.back} />` with `accessibilityLabel={backLabel}`
- **AND** no visible text label is rendered inside the button

#### Scenario: Instructions button renders icon

- **WHEN** `icons.instructions` is provided and `showInstructionsButton` is `true`
- **THEN** the instructions button renders `<Image source={icons.instructions} />` with `accessibilityLabel={instructionsLabel}`

#### Scenario: Advance button renders active icon

- **WHEN** `icons.advance` is provided and `advanceArrow` is `"blue"`
- **THEN** the advance button renders `<Image source={icons.advance} />`

#### Scenario: Advance button renders inactive icon

- **WHEN** `icons.advanceInactive` is provided and `advanceArrow` is `"gray"`
- **THEN** the advance button renders `<Image source={icons.advanceInactive} />`

#### Scenario: Text fallback when icons absent

- **WHEN** `icons` prop is omitted
- **THEN** chrome buttons render text labels as before (no breaking change)

### Requirement: App layer supplies icon requires via GameShellContainer

`GameShellContainer` SHALL accept an `icons` prop of type `GameShellIcons` and thread it through to `GameShellScreen`. The app layer (the screen that mounts `GameShellContainer`) SHALL supply Metro static `require()` calls for the six drawable assets: `zz_games_home`, `zz_instructions`, `zz_forward`, `zz_forward_inactive`, `zz_complete`, `zz_incomplete`.

#### Scenario: Icons prop flows from app to screen

- **WHEN** the app passes `icons` to `GameShellContainer`
- **THEN** `GameShellScreen` receives the same `icons` object unchanged

#### Scenario: Assets resolve at runtime

- **WHEN** the app bundle loads with icon requires wired
- **THEN** all six icon images resolve without a missing-asset error
