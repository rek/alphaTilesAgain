## Context

`GameShellScreen` renders a top `ScoreBar` and a bottom chrome row. The tracker dots are currently hidden from screen readers (`accessibilityElementsHidden`), opposite of Java's `contentDescription="Tracker N of 12"`. The chrome row uses `<Text>` inside each `<Pressable>`, while Java uses icon drawables (`zz_games_home`, `zz_instructions`, `zz_forward`, `zz_forward_inactive`, `zz_complete`, `zz_incomplete`).

The app already has a pattern for injecting Metro static asset requires into shell components: `GameShellScreen` accepts `celebrationSource` from the app layer. The same pattern applies here.

## Goals / Non-Goals

**Goals:**
- Tracker dots expose individual `accessibilityLabel="Tracker N of 12"` matching Java strings
- Chrome buttons render icon images; existing label props become `accessibilityLabel` only
- Tracker dots render `zz_complete`/`zz_incomplete` images instead of colored circles

**Non-Goals:**
- Challenge-level normalization (already implemented)
- New game logic, scoring, or navigation changes
- Swapping drawable assets for custom redesigned icons

## Decisions

### D1 — Icons injected from app layer (not bundled in libs)

Metro `require()` must be static (literal path known at build time). Libs cannot hold `require()` calls for assets that live in `apps/alphaTiles`. Pattern already established: `GameShellScreen` receives `celebrationSource` as a prop. Same approach for chrome icons: `GameShellScreen` gains an `icons` prop of type `GameShellIcons`, and `ScoreBar` gains a `trackerIcons` prop.

Alternative considered: embed default icon URIs (like `celebrationSource`'s Lottie URL default). Rejected — tracker icons are small PNGs that must work offline.

### D2 — `ScoreBar` renders `<Image>` for tracker states, `<View>` fallback

`ScoreBar` accepts optional `trackerIcons?: { complete: ImageSourcePropType; incomplete: ImageSourcePropType }`. When provided, renders `<Image>` instead of colored `<View>` dots. When absent, falls back to current circle implementation (keeps Storybook/tests working without asset wiring).

### D3 — Chrome button props stay; `<Text>` becomes `<Image>`

`backLabel`, `instructionsLabel`, `replayLabel` remain on `GameShellScreenProps` — they shift to `accessibilityLabel` on each `<Pressable>`. `GameShellScreen` gains `icons?: GameShellIcons` with optional fields per button. When `icons` absent, falls back to text (existing behavior, no breaking change).

```ts
type GameShellIcons = {
  back?: ImageSourcePropType;
  instructions?: ImageSourcePropType;
  advance?: ImageSourcePropType;
  advanceInactive?: ImageSourcePropType;
  trackerComplete?: ImageSourcePropType;
  trackerIncomplete?: ImageSourcePropType;
};
```

App layer (`_layout.tsx` or the screen that mounts `GameShellContainer`) passes:

```ts
icons={{
  back: require('../../../assets/zz_games_home.png'),
  instructions: require('../../../assets/zz_instructions.png'),
  advance: require('../../../assets/zz_forward.png'),
  advanceInactive: require('../../../assets/zz_forward_inactive.png'),
  trackerComplete: require('../../../assets/zz_complete.png'),
  trackerIncomplete: require('../../../assets/zz_incomplete.png'),
}}
```

`GameShellContainer` threads `icons` down to `GameShellScreen`; `GameShellScreen` splits tracker icons out to `ScoreBar`.

## Risks / Trade-offs

- [Risk] Java drawables are Android-density-bucketed PNGs; direct copy may look soft on high-DPI iOS. → Mitigation: copy `drawable-hdpi` as baseline; add `@2x`/`@3x` variants if visual QA fails.
- [Risk] Optional fallback (text when icons absent) means Storybook stories show old behavior unless updated. → Accepted: Storybook update is part of tasks.

## Open Questions

- Should `zz_complete`/`zz_incomplete` tracker images replace dots entirely, or sit alongside the colored-circle fallback permanently? (Assumed: replace when icons provided.)
- Are there RTL concerns for the chrome icon order? (Assumed: no, `GameShellScreen` already uses `flexDirection: 'row'` and the icon swap is visual-only.)
