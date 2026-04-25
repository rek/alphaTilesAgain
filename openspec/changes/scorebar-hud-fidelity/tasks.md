## 1. Asset Setup

- [x] 1.1 Copy `zz_games_home.png`, `zz_instructions.png`, `zz_forward.png`, `zz_forward_inactive.png`, `zz_complete.png`, `zz_incomplete.png` from Java `drawable-hdpi/` into `apps/alphaTiles/assets/`
- [ ] 1.2 Add `@2x`/`@3x` variants if visual QA requires (use hdpi as `@1x` baseline)

## 2. ScoreBar — Tracker Accessibility + Icon Rendering

- [x] 2.1 Add `trackerIcons?: { complete: ImageSourcePropType; incomplete: ImageSourcePropType }` prop to `ScoreBarProps`
- [x] 2.2 Replace `accessibilityElementsHidden` / `importantForAccessibility="no"` with `accessible={true}` on each tracker dot
- [x] 2.3 Add `accessibilityLabel` to each dot: `"Tracker N of 12, complete"` or `"Tracker N of 12, incomplete"` based on state
- [x] 2.4 Render `<Image>` when `trackerIcons` provided; keep colored `<View>` circle as fallback

## 3. GameShellScreen — Chrome Icon Rendering

- [x] 3.1 Define `GameShellIcons` type in `GameShellScreen.tsx` and add `icons?: GameShellIcons` to `GameShellScreenProps`
- [x] 3.2 Back button: render `<Image source={icons.back} />` when `icons.back` present; else keep `<Text>{backLabel}</Text>`; move `backLabel` to `accessibilityLabel` on `<Pressable>` in both branches
- [x] 3.3 Instructions button: same pattern with `icons.instructions` + `instructionsLabel`
- [x] 3.4 Advance/replay button: render `icons.advance` (active) or `icons.advanceInactive` (gray state); keep text fallback
- [x] 3.5 Thread `trackerIcons` subset from `icons` down to `<ScoreBar trackerIcons={...} />`

## 4. GameShellContainer — Prop Threading

- [x] 4.1 Add `icons?: GameShellIcons` to `GameShellContainer` props
- [x] 4.2 Pass `icons` through to `GameShellScreen`

## 5. App Layer Wiring

- [x] 5.1 In the screen/layout that mounts `GameShellContainer`, add static `require()` calls for all six assets and pass as `icons` prop

## 6. Verification

- [ ] 6.1 Run the game; confirm chrome buttons show icons not text
- [ ] 6.2 Run the game; confirm tracker dots show `zz_complete`/`zz_incomplete` images
- [ ] 6.3 Run accessibility inspector; confirm each tracker reads "Tracker N of 12, complete/incomplete"
- [x] 6.4 Update `ScoreBar.stories.tsx` to include a story with `trackerIcons` supplied
- [x] 6.5 Run `nx test shared-ui-score-bar` — all tests pass
