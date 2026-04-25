# Tasks

Configure per-language EAS Build profiles and GitHub Actions matrix workflow.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Read existing `eas.json` to understand current profile structure.
- [ ] Confirm `ts-node` available in dev dependencies; add if missing.
- [ ] Confirm `.github/workflows/` directory exists; create if not.
- [ ] Verify no existing workflow named `ci-lang-builds.yml` conflicts; check sibling `ci-bundle-analysis.yml` name is distinct.

## 1. Config File

- [ ] Create `scripts/supported-langs.json` with initial lang codes `["yue", "eng"]`.
- [ ] Verify file parses as valid JSON: `node -e "require('./scripts/supported-langs.json')"`.

## 2. eas.json Profiles

- [ ] For each lang in `supported-langs.json`, add a `<lang>-production` profile to `eas.json` under `build`. Each profile SHALL set `env.APP_LANG` to the lang code and inherit the existing `production` base profile via `extends: "production"` (or equivalent).
- [ ] Example profile structure:
  ```json
  "yue-production": {
    "extends": "production",
    "env": {
      "APP_LANG": "yue"
    }
  }
  ```
- [ ] Validate `eas.json` is valid JSON: `node -e "require('./eas.json')"`.
- [ ] Dry-run one profile: `eas build --profile yue-production --platform android --non-interactive --dry-run` (or `--json --no-wait` if `--dry-run` unsupported by EAS CLI version).

## 3. Matrix Script

- [ ] Create `scripts/eas-build-matrix.ts`.
- [ ] Script reads `scripts/supported-langs.json`, accepts optional `--env <environment>` arg (default `production`).
- [ ] Script prints to stdout a JSON array of `{ profile: string, lang: string }` objects, one per lang.
- [ ] Script exits non-zero if `supported-langs.json` is missing or the parsed array is empty.
- [ ] Smoke-test locally: `npx ts-node scripts/eas-build-matrix.ts` — confirm valid JSON output matching the langs in config.
- [ ] Smoke-test with flag: `npx ts-node scripts/eas-build-matrix.ts --env staging` — confirm profile names end in `-staging`.

## 4. GitHub Workflow

- [ ] Create `.github/workflows/ci-lang-builds.yml`.
- [ ] Workflow name: `CI — Language Builds`.
- [ ] Triggers: `push` to `main`, `workflow_dispatch`.
- [ ] Job `generate-matrix` runs `npx ts-node scripts/eas-build-matrix.ts` and sets output `matrix`.
- [ ] Job `build` depends on `generate-matrix`, uses `strategy.matrix: ${{ fromJSON(needs.generate-matrix.outputs.matrix) }}`.
- [ ] Each matrix job runs `eas build --profile ${{ matrix.profile }} --platform all --non-interactive` with `EXPO_TOKEN` from secrets.
- [ ] All required secrets referenced from D6 secret table present in workflow env or step `env:` blocks.
- [ ] Confirm workflow filename `ci-lang-builds.yml` does not collide with `ci-bundle-analysis.yml`.

## 5. Verification

- [ ] Lint workflow YAML: `npx action-validator .github/workflows/ci-lang-builds.yml` or equivalent.
- [ ] Type-check script: `npx tsc --noEmit scripts/eas-build-matrix.ts`.
- [ ] Run matrix script, pipe to `jq .` to confirm valid JSON structure.
- [ ] Trigger `workflow_dispatch` on a branch; confirm all lang matrix jobs appear in GHA UI and reach the EAS Build queue.
- [ ] Confirm each EAS Build job has `APP_LANG` set correctly in the build logs.
- [ ] Add a test lang code to `supported-langs.json`, re-run matrix script — confirm new entry appears without any other file changes.
- [ ] Remove the test entry after verification.
