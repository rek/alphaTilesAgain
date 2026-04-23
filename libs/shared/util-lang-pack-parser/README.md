# @shared/util-lang-pack-parser

Pure TypeScript parsers for AlphaTiles language-pack `aa_*.txt` files.

## Rules

- One function per file. File name = export name.
- No barrel files except `src/index.ts`.
- No runtime deps — string operations only; no `fs`, `path`, `react`, or any library.
- Types inferred from return shapes via `ReturnType<typeof parseX>`.

## Usage

```ts
import { parsePack, parseLangInfo, parseGametiles, LangPackParseError } from '@shared/util-lang-pack-parser';

// Aggregate — takes the rawFiles map from langManifest.rawFiles
const pack = parsePack(langManifest.rawFiles);
pack.langInfo.find('Script direction (LTR or RTL)'); // 'LTR'
pack.tiles.rows[0].base;                             // 'a'
pack.colors.hexByIndex[5];                           // '#FFFF00'

// Individual parser
const info = parseLangInfo(rawString);

// Structural errors
try {
  parseGametiles(malformedSrc);
} catch (e) {
  if (e instanceof LangPackParseError) {
    console.error(e.file, e.line, e.expected, e.got, e.reason);
  }
}
```

## Design

See `openspec/changes/lang-pack-parser/design.md`.

Java source reference: `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` lines ~250–900.
