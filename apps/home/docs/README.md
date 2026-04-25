# Home — Documentation

Central landing page linking to all language builds.

---

## URL Structure

| App         | Path                    |
| ----------- | ----------------------- |
| Home (this) | `/`                     |
| Eng build   | `/engEnglish4/`         |
| Yue build   | `/yueCantonese/`        |

Links are hardcoded in `src/app/home.tsx` (`LANGUAGES` array, `fixture` field → path).

---

## Local Development

```bash
nx serve home
```

## Build

```bash
nx build home
```
