# Home — Documentation

Central landing page for the different language builds

---

## Development Deployment

..

## URL Structure

All apps share a single deployment under the same domain:

| App              | Path                                      |
| ---------------- | ----------------------------------------- |
| Hub (this app)   | `/Daily-Provisions-App/`                  |
| Daily Provisions | `/Daily-Provisions-App/daily-provisions/` |
| Treasure Chest   | `/Daily-Provisions-App/treasure-chest/`   |
| Way of Salvation | `/Daily-Provisions-App/way-of-salvation/` |

Because paths are known ahead of time, the hub's links are hardcoded in `src/app/app.tsx` (`BASE` constant + each app's `slug`).

---

## Local Development

```bash
nx serve home
```

...
