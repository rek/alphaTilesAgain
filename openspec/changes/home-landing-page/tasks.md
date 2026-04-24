# Tasks: home-landing-page

## 0. Preflight
- [x] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [x] 0.2 Confirm `apps/home` exists and is a Vite app
- [x] 0.3 Verify `npm ci` has been run and `node_modules` are present

## 1. Tailwind Setup
- [x] 1.1 Install `tailwindcss`, `postcss`, and `autoprefixer` at root
- [x] 1.2 Create `apps/home/tailwind.config.js` with content paths to `apps/home/src/**/*.{ts,tsx,html}`
- [x] 1.3 Create `apps/home/postcss.config.js`
- [x] 1.4 Add `@tailwind` directives to `apps/home/src/styles.css`
- [x] 1.5 Update `apps/home/vite.config.ts` if needed (Vite usually auto-picks up PostCSS)

## 2. Landing Page Skeleton
- [x] 2.1 Update `apps/home/src/app/home.tsx` with a basic Tailwind layout (Navbar, Main, Footer)
- [x] 2.2 Verify Tailwind is working by applying a background color and seeing it in the browser

## 3. Hero Section
- [x] 3.1 Implement the Hero section with a title "AlphaTiles" and a compelling subtitle
- [x] 3.2 Add a placeholder "Get Started" button

## 4. Language Build Grid
- [x] 4.1 Define the `LANGUAGES` constant with English, Cantonese, Nepali, and ZH
- [x] 4.2 Create a responsive grid layout (1 column mobile, 2 columns tablet, 4 columns desktop)
- [x] 4.3 Implement the `LanguageTile` component with hover effects, language name, and a "Launch" button

## 5. Educational Content Sections
- [x] 5.1 Add an "About" section explaining the project's purpose
- [x] 5.2 Add a "How it Works" section (Scaffold assets → Generate app → Play games)

## 6. Refinement & Polish
- [x] 6.1 Audit responsive behavior on small screens
- [x] 6.2 Apply final color palette and typography tweaks
- [x] 6.3 Ensure all links are placeholders or point to relevant docs

## 7. Validation
- [x] 7.1 Verify the page renders correctly on web
- [x] 7.2 Ensure `npx tsc --noEmit` is clean for the `home` app
- [x] 7.3 `nx lint home` passes
