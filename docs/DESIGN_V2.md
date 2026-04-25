# Design V2 — Interface Polish Principles

Source: jakub.kr/writing/details-that-make-interfaces-feel-better

These principles apply to all UI screens in AlphaTiles. They compound — each one subtle, together they make the difference between functional and polished.

---

## Typography

**Text wrapping**
- Titles: `text-wrap: balance` — distributes text evenly across lines
- Body paragraphs: `text-wrap: pretty` — prevents orphaned last words
- Apply at layout level (e.g. global styles or base text component)

**Font smoothing**
- `-webkit-font-smoothing: antialiased` on body — crisper text on macOS/iOS
- Apply globally; grayscale antialiasing beats subpixel rendering

**Tabular numbers**
- `font-variant-numeric: tabular-nums` on any numeric display
- Prevents layout shift when score/count updates
- Watch: Inter alters numeral shapes with this — test per font

---

## Spacing & Geometry

**Concentric border radius**
- Rule: `outer radius = inner radius + padding`
- Example: outer `20px`, inner `12px`, padding `8px`
- Nested cards, buttons inside containers — always follow this
- Mismatched radii break visual trust even when users can't name why

**Optical alignment over geometric**
- Geometric center ≠ visually centered — trust your eye
- Icons often sit too low/right when mathematically centered
- Fix misalignment inside the SVG itself (not via margin hacks)

---

## Shadows & Depth

**Layered box-shadow instead of borders**
```
box-shadow:
  0px 0px 0px 1px rgba(0,0,0,0.06),
  0px 1px 2px -1px rgba(0,0,0,0.06),
  0px 2px 4px 0px rgba(0,0,0,0.04);
```
- Adapts to varied backgrounds; borders look flat and stuck
- On hover: slightly darken shadow (use `transition: box-shadow`)
- Use for cards, modals, tiles, image containers

**Image outlines**
- Add `1px solid rgba(0,0,0,0.10)` (or white at 10%) with `outline-offset: -1px`
- Frames images without harsh lines; adds perceived depth
- Especially useful in tile grids and word-image pairs

---

## Motion & Animation

**Entrance animations**
- Combine: `opacity 0→1`, `blur(5px)→0`, `translateY(8px)→0`
- Stagger chunks 80–100ms apart
- Feels alive without demanding attention

**Exit animations**
- Subtler than entrance — smaller values, less blur
- Use `-12px` translateY not full container height
- Direction matters: exits should hint where the thing went

**Interruptible animations**
- CSS transitions for all interactive states (hover, press, focus)
- Transitions interpolate toward latest state — no "stuck" animations
- Reserve keyframe animations for staged one-shot sequences (e.g. level complete)

**Icon animations**
- Animate opacity + scale + blur when icons appear contextually
- Prefer spring physics over linear/ease curves
- Makes interactions feel intentional, not mechanical

---

## Application to AlphaTiles

| Context | Apply |
|---|---|
| Tile grid | concentric radius, layered shadow, image outline |
| Score/counter display | tabular-nums |
| Screen transitions | entrance + exit animation patterns |
| Word/image cards | layered shadow, image outline |
| Modal/overlay | layered shadow, entrance animation |
| Icon buttons | spring animation on appear/disappear |
| Titles & instructions | text-wrap: balance |
| Game body text | text-wrap: pretty |
