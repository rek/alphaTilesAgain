## Context

No Java analog — the legacy Android app has no app-level walkthrough. This is a pure-new feature.

The walkthrough is a one-shot first-launch screen. After dismissal, the flag persists in `AsyncStorage` so subsequent launches skip straight to the player menu. Routing decision moves into `feature-loading` (already the post-boot router).

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing)
- `docs/CODE_STYLE.md` (no direct `useEffect`, container/presenter)
- `libs/alphaTiles/feature-loading/src/` — current post-boot navigation
- `libs/alphaTiles/data-players/src/lib/usePlayersStore.ts` — `AsyncStorage` usage pattern

## Goals / Non-Goals

**Goals:**
- One-shot walkthrough on first launch.
- Skip and Done both mark the flag and navigate to `/menu`.
- Container/presenter split, i18n-blind presenter.
- Loading screen routes around onboarding when already seen.

**Non-Goals:**
- A settings-driven "show onboarding again" toggle.
- Per-game instructions (existing audio system covers it).
- Lang-pack-driven onboarding content.

## Decisions

### D1. State / data flow

`hasSeenOnboarding: boolean` lives in `AsyncStorage` under key `@alphaTiles/hasSeenOnboarding`. Two helpers in `feature-onboarding/src/lib/`:

```ts
// hasSeenOnboarding.ts
export async function hasSeenOnboarding(): Promise<boolean>;

// markOnboardingSeen.ts
export async function markOnboardingSeen(): Promise<void>;
```

`feature-loading` calls `hasSeenOnboarding()` once after boot completes, then `router.replace('/onboarding')` or `router.replace('/menu')`.

`<OnboardingContainer>` calls `markOnboardingSeen()` then `router.replace('/menu')` on Skip or Done.

No Zustand store: single boolean, no UI elsewhere reads it reactively.

### D2. Card sequence

Cards are static content owned by the container as a typed array:

```ts
type OnboardingCard = {
  id: 'welcome' | 'player' | 'doorGrid' | 'scoring';
  title: string;        // pre-translated by container via t('onboarding.<id>.title')
  body: string;         // pre-translated
  imageSource: ImageSourcePropType;
};
```

Container builds the array, passes to presenter as `cards: OnboardingCard[]` plus `skipLabel: string`, `nextLabel: string`, `doneLabel: string`.

### D3. Presenter swiping

`<OnboardingScreen>` uses React Native `FlatList` with `horizontal pagingEnabled` (no extra deps). Tracks current index via `onMomentumScrollEnd`. Props:

```ts
type OnboardingScreenProps = {
  cards: OnboardingCard[];
  skipLabel: string;
  nextLabel: string;
  doneLabel: string;
  onSkip: () => void;
  onDone: () => void;
};
```

Presenter is hook-free for state? It owns `currentIndex` for visual paging only — pure-derived from scroll, no effects, acceptable per project rule (no business state).

If strict no-state-in-presenter is required, container can lift `currentIndex` and pass `onIndexChange`. Default: keep paging-index local in presenter (visual only). See Unresolved.

### D4. Loading screen branching

`feature-loading` currently calls `router.replace('/menu')` once boot complete. Change:

```ts
useMountEffect(() => {
  void boot().then(async () => {
    const seen = await hasSeenOnboarding();
    router.replace(seen ? '/menu' : '/onboarding');
  });
});
```

Single async read; AsyncStorage round-trip is sub-frame on warm cache, acceptable inline with boot finalization.

### D5. i18n

New namespace `onboarding` with keys: `welcome.title`, `welcome.body`, `player.title`, `player.body`, `doorGrid.title`, `doorGrid.body`, `scoring.title`, `scoring.body`, `skip`, `next`, `done`. English bundled; other locales fall back via i18next default.

### D6. No backwards-compat shim

Existing installs that already have data but no flag will see onboarding once. Acceptable — flag is install-scoped and content is short.

## Unresolved Questions

- Presenter local state for `currentIndex`: keep in presenter (simpler, visual-only) or lift to container (strict purity)? Recommend keep-in-presenter.
- Image assets: 4 images (one per card) — source from designer or use placeholder app icon for v1?
