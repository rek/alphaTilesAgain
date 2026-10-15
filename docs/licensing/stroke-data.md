# Stroke-order data licensing (writing game / `game-taiwan`)

Resolves GitHub issue #46 and `openspec/changes/game-taiwan/tasks.md` 10.3 / 12.3.

> **Not legal advice.** This is an engineering reading of the licence texts,
> written to decide what the code must do. It is not a lawyer's opinion. If
> the project wants certainty (for example before a paid or institutional
> release), have counsel review §6 and the checklist.

Last checked: 2026-10-15.

## TL;DR

- **There is no LGPL question for what we ship.** Make Me a Hanzi (MMH) has two
  data files under two licences. `dictionary.txt` is LGPL-3.0+. We do not use
  it. `graphics.txt` (the stroke data) is under the **Arphic Public License
  (APL, 1999)**. The "LGPL" label in the earlier docs mixed the two files up.
- What we ship is a **modified, subset copy** of `graphics.txt` data. We get it
  through `hanzi-writer-data` 2.0.1, which is also APL. We cut it to one pack's
  characters, change the fields, and compile it into the JS bundle.
- Shipping modified APL data is allowed, with conditions: keep the licence
  text unaltered (§1), put a "how and when changed" notice in each modified
  file (§2a), and make the modified data freely available under the APL (§2b).
  The APL's aggregation clause keeps the rest of the app outside the licence.
- Before this change we **did not comply**. There was no licence text in the
  app or next to the data, no modification notice, a broken licence link in
  NOTICE, and a wrong font and licence attribution.
- **After this change: compliant, as far as an engineering reading can tell.**
  This holds only while the modified data stays public at the place we point
  to (see the checklist).
- **Recommendation: comply as-is with the listed changes (done).** Don't
  change the data source and don't ship without the writing game. Legal
  sign-off is optional. See §7.

## 1. What we actually ship

| Item | What / where | Licence | How it reaches users |
|---|---|---|---|
| Stroke outlines + medians for 164 yue characters | `languages/yue/strokes/<char>.json` (committed), made by `tools/build-stroke-data.ts` | **Arphic Public License** | `tools/generate-lang-manifest.ts` inlines every `strokes/*.json` as a JS literal into `libs/alphaTiles/data-language-assets/src/generated/langManifest.ts`. That lands in the Android JS bundle (Hermes) and the web JS chunks. It is **not** a separate asset file. |
| Upstream of the above | `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/<char>.json`. Fetched at build time and cached in `tools/data/stroke-cache/` (gitignored). The npm package is **not** a dependency. | APL (`"license": "SEE LICENSE IN ARPHICPL.TXT"`) | build-time only |
| Quiz/rendering code | `@jamsch/react-native-hanzi-writer` 1.2.0, pinned in `apps/alphaTiles/package.json` | MIT (© 2022 jamsch) | JS bundle |
| Code that library is based on | `hanzi-writer` (vanilla JS). The RN lib ports parts of it, e.g. `src/hanzi-writer/index.ts` stroke matching. | MIT (© 2014 David Chanin) | JS bundle (via the port) |
| MMH `dictionary.txt` | **not used** | LGPL-3.0+ | — |

Transform applied by `tools/build-stroke-data.ts` (`wrapWithCharacter`):

- **Subset:** only the Han characters in the pack's `aa_gametiles.txt` are kept.
- **Fields:** a `character` field is added. Only `strokes` and `medians` are
  kept, so `radStrokes` is dropped. JSON is re-serialised.
- **Notice:** since this change, an `_notice` field is added (APL §2a).

Stroke geometry is byte-identical to upstream. This was checked after
re-running the build: every file matches the previous commit except for
`_notice`.

## 2. Primary sources and exact clauses

### 2.1 Make Me a Hanzi: two files, two licences

<https://github.com/skishore/makemeahanzi/blob/master/COPYING> (checked at
`bddc96d`, 2026-03-08):

> dictionary.txt is derived from: Unihan … CJKlib …
> You can redistribute and/or modify dictionary.txt under the terms of the GNU
> Lesser General Public License as published by the Free Software Foundation,
> either version 3 of the license, or (at your option) any later version.

> graphics.txt is derived from:
>     Arphic PL KaitiM GB - …
>     Arphic PL UKai - …
>
> You can redistribute and/or modify graphics.txt under the terms of the Arphic
> Public License as published by Arphic Technology Co., Ltd. You should have
> received a copy of this license (the directory "APL") along with graphics.txt

<https://github.com/skishore/makemeahanzi/blob/master/README.md>:

> Make Me a Hanzi data is split into two data files, dictionary.txt and
> graphics.txt, because the sources that the files are derived from have
> different licenses.

The licence text lives at
<https://github.com/skishore/makemeahanzi/blob/master/APL/english/ARPHICPL.TXT>.
The old NOTICE linked to `…/master/ARPHICPL.TXT`, which does not exist.

### 2.2 hanzi-writer-data (our direct source)

<https://github.com/chanind/hanzi-writer-data/blob/master/README.md#license>:

> This data comes from the Make Me A Hanzi project, which extracted the data
> from fonts by Arphic Technology … You can redistribute and/or modify this
> data under the terms of the Arphic Public License as published by Arphic
> Technology Co., Ltd. A copy of this license can be found in ARPHICPL.TXT.

`npm view hanzi-writer-data license version` gives
`SEE LICENSE IN ARPHICPL.TXT`, `2.0.1`. The README also says: "This data is
licensed separately from the Hanzi Writer source code."

The `ARPHICPL.TXT` files in hanzi-writer-data and in MMH (`APL/english/`) are
byte-identical apart from a trailing newline. We vendor the MMH copy at
`libs/alphaTiles/data-stroke-data/ARPHICPL.TXT`.

### 2.3 Arphic Public License: the clauses that matter

Source: the ARPHICPL.TXT above (© 1999 Arphic Technology Co., Ltd.).

- §0 Definitions: "Font" covers the four Arphic TrueType fonts "and the
  derivatives of those fonts created through any modification including
  modifying glyph, reordering glyph, converting format, changing font name, or
  adding/deleting some characters in/from glyph table." MMH, hanzi-writer-data
  and we all treat the extracted stroke data as such a derivative. It is
  "converting format" plus "deleting some characters".
- §1 Copying & Distribution: "You may copy and distribute verbatim copies of
  this Font in any medium, without restriction, provided that you retain this
  license file (ARPHICPL.TXT) unaltered in all copies."
- §2 Modification: "You may otherwise modify your copy of this Font in any way
  … and copy and distribute such modifications under the terms of Section 1
  above, provided that the following conditions are met:"
  - "a) You must insert a prominent notice in each modified file stating how
    and when you changed that file."
  - "b) You must make such modifications Freely Available as a whole to all
    third parties under the terms of this License, such as by offering access
    to copy the modifications from a designated place, or distributing the
    modifications on a medium customarily used for software interchange."
  - "c) If the modified fonts normally reads commands interactively when run,
    you must cause it … to print or display an announcement including an
    appropriate copyright notice and a notice that there is no warranty … and
    telling the user how to view a copy of this License."
  - "These requirements apply to the modified work as a whole. If identifiable
    sections of that work are not derived from the Font, and can be reasonably
    considered independent and separate works in themselves, then this License
    and its terms, do not apply to those sections when you distribute them as
    separate works. Therefore, mere aggregation of another work not based on
    the Font with the Font on a volume of a storage or distribution medium does
    not bring the other work under the scope of this License."
- §0: "'Freely Available' means that you have the freedom to copy or modify the
  Font as well as redistribute copies of the Font under the same conditions you
  received, not price. If you wish, you can charge for this service."
- §3 Condition Subsequent: "Any attempt otherwise to copy, modify, sublicense
  or distribute the Font will automatically retroactively void your rights
  under this License." Non-compliance is costly, so the checks below run as
  tests.
- §5 Automatic Receipt: "You may not impose any further restrictions on the
  recipients' exercise of the rights granted herein."
- §7 NO WARRANTY and §8 DAMAGES WAIVER: disclaimers, which we reproduce.

### 2.4 How third parties classify the APL

- FSF, <https://www.gnu.org/licenses/license-list.html#Arphic>: "This is a
  copyleft free software license, incompatible with the GPL. Its normal use is
  for fonts, and in that use, the incompatibility does not cause a problem."
- SPDX id `Arphic-1999`, <https://spdx.org/licenses/Arphic-1999.html>.

The APL is copyleft over the Font and its derivatives only. Unlike the LGPL,
it has no "library vs. work that uses the library" mechanism. So the LGPL's
"separate file / relinkable" requirement is **not** a thing here.

### 2.5 Code libraries

- `@jamsch/react-native-hanzi-writer` 1.2.0: `node_modules/@jamsch/react-native-hanzi-writer/LICENSE`
  is "MIT License, Copyright (c) 2022 jamsch". Also `npm view … license` gives
  `MIT`. Its README says it is "based on the vanilla JS hanzi-writer library".
- `hanzi-writer`: <https://github.com/chanind/hanzi-writer/blob/master/LICENSE>
  is "The MIT License (MIT) Copyright (c) 2014 David Chanin". `npm view
  hanzi-writer license` gives `MIT`.
- MIT condition: "The above copyright notice and this permission notice shall
  be included in all copies or substantial portions of the Software." Both
  notices are now in `apps/alphaTiles/NOTICE.md`. The app has no general
  in-app list of every npm dependency's licence. That gap is app-wide and not
  specific to this game (see §8).

## 3. What a Google Play / web distribution must do (APL)

1. **Ship the licence text unaltered** with every copy (§1). This applies to
   the APK/AAB and the web build.
2. **Notice in each modified file** saying how and when it changed (§2a). Our
   files are modified (subset, re-format, field changes).
3. **Make the modified data freely available** under the APL from a
   designated place (§2b). This means the modified data, not the app's source.
4. **Copyright + no-warranty notice, and how to view the licence**, shown to
   users. §2c literally targets "modified fonts" that read commands
   interactively, so it is arguably not triggered by inert data. We do it
   anyway because it costs nothing.
5. **No extra restrictions** on recipients' rights in the data (§5). Don't put
   an EULA clause on the app that forbids copying or modifying the stroke
   data.
6. **The rest of the app is not pulled in.** The app's own code is "not
   derived from the Font" and is an "independent and separate work". The
   aggregation sentence covers it being on the same "distribution medium".
   The APL also lacks the GPLv2 sentence that extends the licence to "a whole
   which is a work based on the Program".

## 4. Does our bundling comply?

| Question | Answer |
|---|---|
| Subsetting per pack OK? | Yes. §0/§2 explicitly allow "adding/deleting some characters". It counts as a modification, so §2a/§2b apply. |
| Re-formatting / dropping `radStrokes` / adding `character` OK? | Yes ("converting format", "in any way"). Also a modification. |
| Inlining into the JS bundle (not a separate asset file) OK? | Yes, in this reading. The APL has no LGPL-style separate-file or relink requirement. The data stays identifiable inside the bundle: one object per character, each with its `_notice`. The surrounding code is a separate work (§2 last paragraph). A separate asset file would make the "mere aggregation" argument even cleaner. It is an optional hardening step and not needed (see §7). |
| CDN-fetch-at-build-time OK? | Yes. Pinned to exactly `2.0.1` (it used to float on `@2.0`) so the provenance in the notices is exact. |
| Before this change | **Not compliant.** §1: no licence text in the app or next to the data. §2a: no per-file notice. §2b: the data was in the public repo but not labelled as APL. NOTICE.md had a broken licence URL, the wrong fonts (PL UMing/KaitiM instead of KaitiM GB/UKai), "LGPL-style", and a false "loaded as JSON at runtime" claim. |
| After this change | **Compliant**, subject to checklist item 5 (repo stays public). |

## 5. Compliance checklist

| # | Requirement (clause) | How we meet it | Where | Status |
|---|---|---|---|---|
| 1 | Licence unaltered in all copies (§1), in the app | Verbatim APL is compiled into the bundle and shown on the About screen ("Open-source licences" → "Show licence text"). It appears only when the pack has stroke data. | `libs/alphaTiles/data-stroke-data/src/lib/arphicLicense.ts`, `libs/alphaTiles/feature-about/src/AboutContainer.tsx` | done |
| 2 | Licence unaltered next to the redistributed data (§1) | `build-stroke-data.ts` copies `ARPHICPL.TXT` into `languages/<pack>/strokes/` | `languages/yue/strokes/ARPHICPL.TXT` | done |
| 3 | Licence copy really is verbatim | Jest test compares the TS constant to the vendored file byte for byte | `arphicLicense.test.ts` | done |
| 4 | "How and when changed" notice in each modified file (§2a) | `_notice` field in every `strokes/<char>.json`. It survives into the bundle. The About-screen attribution repeats it. | `tools/build-stroke-data.ts` (`STROKE_NOTICE`), `strokeDataAttribution.ts` | done |
| 5 | Modified data Freely Available under the APL from a designated place (§2b) | Public repo `rek/alphaTilesAgain`, `languages/<pack>/strokes/` (data + ARPHICPL.TXT). The About screen names the URL. | — | done. **Owner: keep the repo public, or publish the strokes folder elsewhere and update the URL.** |
| 6 | Copyright + no-warranty + how to view the licence, shown to users (§2c, belt-and-braces) | About-screen attribution: © 1999 Arphic, NO WARRANTY, licence text one tap away | `strokeDataAttribution.ts` | done |
| 7 | Correct attribution in the repo | NOTICE.md rewritten: APL not LGPL, correct fonts, working links, MIT notices for the code libs | `apps/alphaTiles/NOTICE.md` | done |
| 8 | Exact provenance | CDN pinned to `hanzi-writer-data@2.0.1` | `tools/build-stroke-data.ts` | done |
| 9 | No extra restrictions on recipients (§5) | No EULA. Keep it that way, or exempt the stroke data in any future ToS. | — | ongoing |
| 10 | Stay off LGPL material | Never pull MMH `dictionary.txt` (definitions, pinyin, decomposition) into the app without a new review | — | ongoing |
| 11 | When the transform changes | Update the date and description in `STROKE_NOTICE` **and** `STROKE_DATA_ATTRIBUTION`, then re-run `build-stroke-data` for every Chinese pack | — | process |

## 6. Residual risks and uncertainties

- **Is extracted stroke data a "derivative of the Font"?** Copyright in
  typeface designs, as opposed to font software, varies by jurisdiction. The
  US, for example, does not protect typeface designs as such. We take the
  conservative view and follow the APL, as upstream does.
- **Inlining vs. separate file.** In our reading this is fine (§4). A lawyer
  who wants maximum separation could ask for the data as its own asset file.
  That is a moderate refactor: `useStrokes` would load the data asynchronously
  through expo-asset on native and through fetch on web.
- **§5 and store terms.** Google Play's own distribution terms do not restrict
  users' rights in the app's bundled data. The modified data is also available
  outside the store (item 5), which meets §2b independently. Re-check this if
  the app ever goes to a store with restrictive end-user terms (the classic
  App Store / copyleft tension).
- **Retroactive termination (§3).** This is why items 1–4 are automated
  (build script + tests) rather than left to memory.

## 7. Recommendation

**Comply as-is with the listed changes. They are implemented in this branch.**

- Do **not** change the data source. The alternatives are worse for
  Cantonese. KanjiVG (CC BY-SA 3.0) covers Japanese forms and order, not
  Hong Kong traditional usage, and its share-alike is no easier.
- Do **not** ship without the writing game. The fallback in issue #46 is not
  needed.
- **Owner decisions:** (a) accept this engineering analysis, or get a short
  counsel review of §6 if the release context needs one; (b) commit to keeping
  `rek/alphaTilesAgain` public, or another public copy of the `strokes/`
  folders, for as long as builds containing the data are distributed.

## 8. Out of scope / follow-ups

- **App-wide licence list.** There is no general "open-source licences" list
  for all npm dependencies (MIT/BSD/Apache notices). That affects the whole
  app, not this game. A generated list (e.g. from `license-checker`) on the
  About screen would close it.
- **Other stroke data.** Devanagari stroke data (CC BY-SA 3.0, `game-india-deva`)
  and Tibetan synthetic data have their own NOTICE entries and are not covered
  here.
- **LGPL in the lockfile.** The only LGPL entry in `package-lock.json` is
  `@ltd/j-toml`, a dev-only dependency that is not shipped.
