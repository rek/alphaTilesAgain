# Commit Conventions

Follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

- **feat**: new feature
- **fix**: bug fix
- **docs**: documentation only
- **style**: formatting, whitespace (no logic change)
- **refactor**: code restructure (no feature/fix)
- **perf**: performance improvement
- **test**: adding or updating tests
- **chore**: build process, dependencies, tooling
- **ci**: CI configuration

## Scope (Optional)

Affected area: `game`, `ui`, `navigation`, `score`, `tiles`, etc.

## Subject

- Imperative mood ("add" not "added")
- No capital first letter
- No period at end
- Max 50 characters

## Examples

```
feat(game): add tile drag-and-drop
fix(score): prevent negative score on undo
refactor(tiles): extract TileCell from GameBoard
test(hooks): add useGameState unit tests
chore: update expo to v54
```

## With Body

```
feat(game): add animated tile placement

Tiles slide into position when placed rather than appearing instantly.
Uses reanimated spring animation for natural feel.
```

## Quick Reference

| Type | When |
|------|------|
| `feat` | new functionality |
| `fix` | bug fix |
| `refactor` | restructure without behavior change |
| `perf` | speed/memory improvement |
| `test` | tests only |
| `chore` | tooling/deps |

## Common Mistakes

```
# ❌ Bad
Fixed stuff
Update
WIP
Changes to game screen

# ✅ Good
fix(game): resolve tile overlap on rapid placement
feat(score): add combo multiplier display
```
