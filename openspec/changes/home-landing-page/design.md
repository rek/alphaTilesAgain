## Context

The `home` app is a Vite-based React application in the `apps/home/` directory. Currently, it's a minimal scaffold. The goal is to transform it into a full-featured landing page for the AlphaTiles project, showcasing the various language builds.

This change introduces Tailwind CSS to the monorepo specifically for the `home` app and implements a modern design.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` — overview of the monorepo structure.
- `docs/CODE_STYLE.md` — follow React and TypeScript conventions.

## Goals / Non-Goals

**Goals:**

- Modernize the `home` landing page using Tailwind CSS.
- Display a grid of interactive tiles for English, Cantonese, Nepali, and ZH builds.
- Provide a clear value proposition for AlphaTiles via hero and info sections.
- Ensure responsive design (mobile/desktop).
- Use placeholder links for the actual app builds.

**Non-Goals:**

- Implement the actual language apps (handled by `apps/alphaTiles/`).
- Real backend integration.
- Perfect 1:1 design matching (aim for "beautiful and modern" rather than a specific mockup).

## Decisions

### D1. Tailwind CSS Integration

Tailwind CSS will be installed as a dev dependency in the root `package.json` but configured specifically for the `home` app.

- Add `tailwindcss`, `postcss`, `autoprefixer` to root `package.json`.
- Create `apps/home/tailwind.config.js` and `apps/home/postcss.config.js`.
- Import Tailwind directives in `apps/home/src/styles.css`.

### D2. Landing Page Structure

The `home.tsx` component will be broken down into functional sections (all in one file for now, following the "one function per file" rule where reasonable, or using sub-components defined within the same file if they are purely presentational and specific to the landing page).

Sections:
1. **Navbar**: Logo and minimal links.
2. **Hero**: Title, subtitle, and a "Get Started" CTA.
3. **Language Grid**: The core feature. A responsive grid of 4 tiles.
4. **Features/About**: 3-column section explaining key AlphaTiles features.
5. **Footer**: Simple copyright and project links.

### D3. Language Tile Data

The tile data will be hardcoded in `home.tsx` for now.

```ts
const LANGUAGES = [
  { id: 'eng', name: 'English', fixture: 'engEnglish4', icon: 'A' },
  { id: 'yue', name: 'Cantonese', fixture: 'yueCantonese', icon: '粵' },
  { id: 'nep', name: 'Nepali', fixture: 'nepNepali', icon: 'न' },
  { id: 'cmn', name: 'ZH / Mandarin', fixture: 'cmnMandarin', icon: '中' },
];
```

### D4. Aesthetics

- **Font**: Inter or a clean sans-serif.
- **Colors**: Primary blue (`#2563eb`), secondary teal, white background.
- **Components**: Cards with `hover:shadow-lg transition-shadow`, rounded corners (`rounded-xl`), and ample whitespace.

## Risks / Trade-offs

### R1. CSS Bloat

Using Tailwind adds some build-time overhead but Vite handles tree-shaking (PurgeCSS) well. The resulting bundle will be small.

### R2. Responsive Complexity

Managing a grid and a hero section across all screen sizes requires careful use of Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).

## Migration Plan

- No data migration required.
- The change completely replaces the current "welcome home" content.

## Open Questions

- Should we include actual screenshots of the app in the tiles? (Deferred: Use icons/glyphs for now).
- Do we need a "Search" or "Filter" for languages? (Deferred: Not needed for 4 languages).
