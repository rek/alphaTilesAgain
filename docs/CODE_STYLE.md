# Code Style Guide

## TypeScript

### General Principles

- Strict typing throughout
- Avoid `any` — use `unknown` if type is truly unknown
- Prefer type inference when obvious

### Function Pattern

One export per file. Prefer single-arity functions (object param):

```typescript
export function updateScore({
  current,
  delta,
}: {
  current: number;
  delta: number;
}) {
  return current + delta;
}
```

### Type Organization

**Avoid separate type files.** Use TypeScript inference utilities instead:

```typescript
// Derive from function return type
type GameState = Awaited<ReturnType<typeof getGameState>>;

// Derive from component props
type TileProps = Parameters<typeof Tile>[0];

// Derive from constants
export const TILE_COLORS = ['red', 'blue', 'green'] as const;
type TileColor = (typeof TILE_COLORS)[number];
```

**When you must define a type:**
- Define inline in the file where it's used
- Use `type` not `interface` (except Error Boundary — see below)
- Only export if it's a public API contract

**Do not add explicit return types** — let TypeScript infer:

```typescript
// ✅ Good
export async function fetchScores(userId: string) {
  return await storage.get(`scores:${userId}`);
}

// ❌ Bad
export async function fetchScores(userId: string): Promise<Score[]> { ... }
```

---

## React Native Components

### Component Structure

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

export function TileCell({
  letter,
  value,
  onPress,
}: {
  letter: string;
  value: number;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    setPressed(true);
    onPress();
  };

  if (!letter) return null;

  return (
    <View style={styles.tile}>
      <Text style={styles.letter}>{letter}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { padding: 8, borderRadius: 4 },
  letter: { fontSize: 24, fontWeight: '700' },
  value: { fontSize: 10 },
});
```

### Component Conventions

- **Inline styles = bug.** Always use `StyleSheet.create`.
- **SVG icons over unicode.** Unicode glyphs render inconsistently across devices.
- **Spread `{...rest}` before explicit props** so explicit props win.
- **Extend by composition, not customization.** When adding behavior (animation, press state) to a base component, wrap it in a new component rather than adding props to the base.
- **`ui/` components must not import navigation hooks** (`useRouter`, `useNavigation`). Accept callbacks as props.

---

## Hooks

### Custom Hook Pattern

```typescript
import { useCallback, useState } from 'react';
import { useMountEffect } from '@/hooks/useMountEffect';

export function useGameState({ gameId }: { gameId: string }) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadGame = useCallback(async () => {
    try {
      setLoading(true);
      const state = await storage.getGame(gameId);
      setTiles(state.tiles);
      setScore(state.score);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useMountEffect(() => {
    loadGame();
  });

  return { tiles, score, loading, error, reload: loadGame };
}
```

### useEffect Rules

**Do not use `useEffect` directly.** Use these alternatives:

| Scenario | Solution |
|---|---|
| Value computable from state/props | Inline calculation |
| User interaction | Event handler |
| One-time setup/cleanup | `useMountEffect` |
| Reset on prop change | `key` attribute |
| Expensive computation | `useMemo` |
| Data fetch | `useMountEffect` with cancellation |

#### Rule 1: Derive state, don't sync it

```typescript
// ❌ BAD
const [tiles, setTiles] = useState([]);
const [placedTiles, setPlacedTiles] = useState([]);
useEffect(() => { setPlacedTiles(tiles.filter(t => t.placed)); }, [tiles]);

// ✅ GOOD
const [tiles, setTiles] = useState([]);
const placedTiles = tiles.filter(t => t.placed);
```

#### Rule 2: Event handlers, not effects

```typescript
// ❌ BAD
const [submitted, setSubmitted] = useState(false);
useEffect(() => { if (submitted) { submitScore(); setSubmitted(false); } }, [submitted]);

// ✅ GOOD
<Button onPress={() => submitScore()} />
```

#### Rule 3: `useMountEffect` for one-time setup

```typescript
import { useMountEffect } from '@/hooks/useMountEffect';

function GameBoard() {
  useMountEffect(() => {
    initializeBoard();
    return () => cleanupBoard();
  });
}
```

#### Rule 4: Reset with `key`

```typescript
// ❌ BAD
function Game({ gameId }) {
  useEffect(() => { resetState(); }, [gameId]);
}

// ✅ GOOD
function GameWrapper({ gameId }) {
  return <Game key={gameId} gameId={gameId} />;
}
```

---

## File Organization

### Naming

- **Components**: `PascalCase.tsx` (`GameBoard.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (`useGameState.ts`)
- **Utils**: `camelCase.ts` (`formatScore.ts`)
- **Tests**: `*.test.tsx` / `*.test.ts`
- **Constants**: values in `UPPER_SNAKE_CASE`

### Import Order

```typescript
// 1. React and React Native
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
// 2. Third-party
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
// 3. Local components
import { TileCell } from '@/components/game/TileCell';
// 4. Hooks
import { useGameState } from '@/hooks/useGameState';
// 5. Utils and constants
import { formatScore } from '@/utils/formatScore';
import { TILE_SIZE } from '@/constants/theme';
```

### One Function Per File

File name = export name. No multi-export utility files.

```
utils/
  formatScore.ts      ✅ exports formatScore
  parseTileValue.ts   ✅ exports parseTileValue
  gameUtils.ts        ❌ contains 5 unrelated functions
```

---

## Async Operations

```typescript
async function saveScore({ userId, score }: { userId: string; score: number }) {
  try {
    await storage.set(`score:${userId}`, score);
  } catch (error) {
    if (error instanceof StorageError) {
      throw new Error(`Failed to save score: ${error.message}`);
    }
    throw error;
  }
}
```

### Loading States

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  try {
    await submitScore(score);
  } catch (err) {
    setError(err as Error);
  } finally {
    setLoading(false);
  }
};
```

---

## Error Handling

### Error Boundaries

Note: Error boundaries require class components and `interface` — the one exception to "use `type` not `interface`".

```typescript
import React from 'react';
import { Text } from 'react-native';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <Text>Something went wrong</Text>;
    }
    return this.props.children;
  }
}
```

---

## Testing

Co-locate tests with the code they test.

```typescript
// utils/formatScore.test.ts
import { formatScore } from './formatScore';

describe('formatScore', () => {
  it('formats scores with commas', () => {
    expect(formatScore(1000)).toBe('1,000');
  });
});
```

```typescript
// components/game/TileCell.test.tsx
import { fireEvent, render } from '@testing-library/react-native';
import { TileCell } from './TileCell';

describe('TileCell', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TileCell letter="A" value={1} onPress={onPress} />
    );
    fireEvent.press(getByText('A'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

---

## Naming Conventions

- **Booleans**: `isLoading`, `hasError`, `canSubmit`
- **Functions**: verb-based — `fetchScores`, `handlePress`, `validateWord`
- **Event handlers**: `handle` prefix — `handleTilePress`, `handleSubmit`
- **Constants**: `UPPER_SNAKE_CASE` — `MAX_TILES`, `BOARD_SIZE`
- **Container components**: `[Feature]Screen` (owns hooks)
- **Presenter components**: `[Feature]View` or just `[Feature]` (pure props → JSX)

---

## Accessibility

```typescript
<Pressable
  onPress={handlePress}
  accessible={true}
  accessibilityLabel="Place tile A"
  accessibilityRole="button"
>
  <Text>A</Text>
</Pressable>
```

---

## Performance

```typescript
// Memoize expensive computations
const validWords = useMemo(
  () => findValidWords(placedTiles, dictionary),
  [placedTiles, dictionary]
);

// Memoize stable callbacks
const handleTilePress = useCallback((id: string) => {
  selectTile(id);
}, []);
```

```typescript
// FlatList optimization
<FlatList
  data={scores}
  keyExtractor={(item) => item.id}
  renderItem={renderScore}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

## Don'ts

```typescript
// ❌ Mutate state directly
state.tiles.push(newTile);
// ✅
setTiles(prev => [...prev, newTile]);

// ❌ Inline styles
<View style={{ padding: 16 }} />
// ✅
const styles = StyleSheet.create({ container: { padding: 16 } });

// ❌ Console logs in production
console.log('tile data:', tile);
// ✅
if (__DEV__) console.log('tile data:', tile);
```
