## Why

The current `home` app is a placeholder showing "welcome home". To make AlphaTiles professional and accessible, we need a modern, educational landing page. This page serves as a gateway to the various language builds (English, Cantonese, Nepali, ZH) and provides context about the project.

Using React and Tailwind CSS allows for rapid development of a responsive, beautiful UI that aligns with modern web standards.

## What Changes

- **Tailwind CSS Integration**: Install and configure Tailwind CSS for the `home` app.
- **Hero Section**: Add a high-impact hero section explaining AlphaTiles' mission (literacy game generator for minority language communities).
- **Language Build Grid**: Implement a responsive grid of interactive tiles for the following languages:
  - English (fixture: `engEnglish4`)
  - Cantonese (fixture: `yueCantonese`)
  - Nepali (fixture: `nepNepali`)
  - ZH / Mandarin (fixture: `cmnMandarin`)
- **Interactive Tiles**: Each tile will feature the language name, a representative script/icon, and a link/button to "Launch App" or "Download".
- **Educational Content**: Add sections for "How it Works", "About the Project", and "Get Involved".
- **Responsive Design**: Ensure the landing page looks great on mobile, tablet, and desktop.
- **Modern Aesthetics**: Use a clean palette, rounded corners, subtle shadows, and smooth hover effects.

## Capabilities

### New Capabilities

- `home-landing-page` — A modern, responsive landing page with a language build grid, hero section, and educational content.

### Modified Capabilities

_None_

## Impact

- **New Dependencies**: `tailwindcss`, `postcss`, `autoprefixer` (dev deps).
- **Configuration**: New `tailwind.config.js` and `postcss.config.js` in `apps/home`.
- **UI Refresh**: Complete overhaul of `apps/home/src/app/home.tsx` and `apps/home/src/styles.css`.
- **User Experience**: Signficantly improved first impression for new users and stakeholders.

## Out of Scope

- Real language build links (placeholder links for now).
- Backend integration or analytics (stays static for now).
- Complex animations or transitions.
- Multi-language support for the landing page itself (stays in English for now).
