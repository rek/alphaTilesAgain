# Testing

| Layer | What | Run |
| --- | --- | --- |
| Unit / component | Jest per lib | `npx nx run-many -t test` |
| Typecheck / lint | tsc, eslint (module boundaries) | `npx nx run-many -t typecheck,lint` |
| Web e2e via WebMCP | yue web dev server driven through `at_*` tools, Playwright | `npx nx run alphaTiles-agent-e2e:e2e` (opt-in) |
| Native e2e | Maestro flows on an emulator/simulator | `npx nx run alphaTiles:e2e:maestro` (opt-in) |

The two e2e layers are opt-in: not part of CI, nor the pre-push gate.

## Agent hand-checks (WebMCP)

Not a test layer: a faster way for an agent to verify by hand on a local dev server. In dev (`__DEV__`, web only) the app registers WebMCP tools on `document.modelContext`, so Claude-in-Chrome reads state and acts by name instead of screenshotting and clicking. Start the server with `npx nx run alphaTiles:start-web-yue` (port 8081), enable the WebMCP flag in `chrome://flags` (origin trial), then from the page-JavaScript tool:

```js
await document.modelContext.executeTool((await document.modelContext.getTools()).find(t => t.name === 'at_location'), {})
```

Input is an object, not a JSON string. Re-fetch `getTools()` in each script: a handle from before a re-render throws "not of type 'RegisteredTool'".

| Tool | Proves |
| --- | --- |
| `at_location` | URL path + query, visible headings, testIDs on screen |
| `at_navigate` | `{href}` like a link press; waits for the screen to settle |
| `at_players` | `{action: list/create/select, name, avatarIndex, id}` on the persisted players store |
| `at_doors` | every door: class, variant, level, enabled, the active player's visual state / trackers / points |
| `at_game_state` | current class + door, the player's progress for it, celebration up?, answer tiles shown |
| `at_game_answer` | `{value}` or `{index}`: press a tile; returns whether the tracker rose (`correct`) |
| `at_audio_state` | tap-to-begin gate unlocked, pack clips played since load, the last one |
| `at_settings` | effective settings; `{showGameNames}` sets it for the active player |

- Tools skip the UI, so they prove state, not the button. A flow that must prove the button is a Maestro flow (native) or a Playwright locator.
- `at_audio_state` counts clips handed to the player pool: "the app tried to play", not "you heard it". Audible output on Android stays a human check (#57).
- New tool: one file in `libs/alphaTiles/feature-loading/src/agentTools/` plus one entry in `registerAlphaTilesAgentTools.ts`. Plumbing is `@shared/util-agent-tools`.
- Production carries none of it: `AppShell` `require`s `AgentToolsBridge` inside a `__DEV__ && Platform.OS === 'web'` branch, which Metro drops from `expo export`. Verify: `grep -rl at_game_answer dist/web` finds nothing after `npx nx run alphaTiles:web-export`. (The small `agentProbe` counter module in `util-agent-tools` is bundled; the tools are not.)

### Scripted, headless: `nx run alphaTiles-agent-e2e:e2e`

Playwright drives the yue web dev server through the same tools (`apps/alphaTiles-agent-e2e/agentTools.ts` installs a `document.modelContext` shim before boot, so no flag is needed). Covers the web-automatable parts of issue #57: boot + audio gate, player create and persistence across reload, all 28 yue doors mount a game shell, a game class scores, audio probe for Thailand / Iraq / Sudan / Italy, settings and the share screen.

- Needs Chrome: `channel: 'chrome'`, or `CHROME_PATH=/usr/bin/google-chrome-stable`.
- Starts (or reuses) `nx run alphaTiles:start-web-yue`; a cold Metro bundle takes about a minute.
- A new check is a row in `specs/`; prefer that over a hand-check line in a task list.

## Native e2e (Maestro)

Only what needs a real device runtime: launch, create a player with the on-screen keyboard, tap a door, the shell back button, persistence after a full app relaunch. Everything else is in the WebMCP layer above. Flows live in `e2e/maestro/` (`subflows/` are shared steps, not run alone) and select by `id:` (testID).

Run locally against the EAS `yue-apk` build (`eas.json`, package `com.makektm.alphatiles`):

1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`; boot an Android emulator (or plug in a device with USB debugging).
2. Get the APK: `cd apps/alphaTiles && eas build --profile yue-apk --platform android` and download it, or `APP_LANG=yue npx nx run alphaTiles:buildApk` for a local build.
3. `adb install -r path/to/app.apk`
4. `npx nx run alphaTiles:e2e:maestro` (or `maestro test e2e/maestro/01-player-creation.yaml` for one flow).

The testIDs the flows rely on: `add-player-button`, `avatar-option-N`, `keyboard-key-N`, `set-player-submit`, `player-avatar-tile`, `game-door-tile`, `game-board-tile`, `shell-back-button`, `shell-score-bar`, `menu-tab-*`, `settings-back-button`.

Not automated, still a person with a device (#57): release manifest permissions, Android audio actually audible, boot time / memory with about 400 audio preloads, install-as-app on web.
