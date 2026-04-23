# Feature: [Name]

> Prefer `/opsx:propose` — it generates proposal, specs, design, and tasks in
> `openspec/changes/[feature-name]/`. Use this template only for standalone
> technical designs not tied to a specific feature spec.

## Problem

What problem does this solve? Why now?

## Solution

High-level approach in 2-3 sentences.

## Technical Design

### Libraries

| Library | Type | Scope | Purpose |
| ------- | ---- | ----- | ------- |
| `feature-[name]` | feature | alphaTiles | Container + presenter screens |
| `data-[name]` | data-access | alphaTiles | Data fetching / storage |
| `ui-[name]` | ui | shared | Reusable presentational components |

### Component Structure

```
[Feature]Container (container — owns hooks, i18n, navigation)
  → [Feature]Screen (presenter — pure props → JSX)
    → [SubComponent] (ui lib component)
```

### Data Flow

How data moves: source → transform → display.

### API Contracts

Function signatures, storage keys, external APIs.

## i18n

List translation keys this feature introduces:
- `[feature].[key]` — description

## Testing Strategy

| Library | Test Type | What to Test |
| ------- | --------- | ------------ |
| `feature-[name]` | Integration | User flows, container→presenter wiring |
| `data-[name]` | Unit | Data fetch/transform logic |
| `ui-[name]` | Component | Render, interactions |

## Open Questions

- [ ] Question 1
- [ ] Question 2
