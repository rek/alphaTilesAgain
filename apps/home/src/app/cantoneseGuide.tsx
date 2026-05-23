import { YUE_GAME_ROWS, doorContentKey } from './cantoneseDoors.generated';

type DoorContent = {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mechanic: string;
  what: string;
  good: string;
};

// Hand-authored description per (country, challengeLevel, syllOrTile).
// Source-of-truth door list comes from cantoneseDoors.generated.ts (regen via
// `bun tools/generate-cantonese-doors.ts` after editing languages/yue/aa_games.txt).
// If yue adds a row whose key is not in this map, the page renders an explicit
// "missing description" placeholder so the gap is visible to the next dev.
const DOOR_CONTENT: Record<string, DoorContent> = {
  'thailand-165-T': {
    title: 'Word listening — Easy',
    difficulty: 'Easy',
    mechanic: 'Thailand · listen-and-pick',
    what: 'Plays a Cantonese word aloud. The student picks the matching picture from four options. Distractor pictures are loosely related.',
    good: 'First exposure to spoken Cantonese vocabulary. Use this with students who are brand new.',
  },
  'thailand-265-T': {
    title: 'Word listening — Medium',
    difficulty: 'Medium',
    mechanic: 'Thailand · listen-and-pick',
    what: 'Same format as the easy version — hear a word, pick the picture — but distractors share more features with the correct answer.',
    good: 'Students who are comfortable with the basic vocabulary and ready to listen more carefully.',
  },
  'thailand-365-T': {
    title: 'Word listening — Hard',
    difficulty: 'Hard',
    mechanic: 'Thailand · listen-and-pick',
    what: 'Same hear-a-word, pick-a-picture format with the hardest distractors. The distractors sound or look similar to the correct answer.',
    good: 'Students who can already pick out the easy pairs and need a real listening challenge.',
  },
  'thailand-234-T': {
    title: 'Listen and read',
    difficulty: 'Medium',
    mechanic: 'Thailand · audio → written word',
    what: 'Plays a Cantonese word aloud. The student picks its written form from four choices (no picture cue).',
    good: 'Reading practice with an audio prompt — easier than the picture-to-writing door because the student hears the word.',
  },
  'thailand-344-T': {
    title: 'Picture to writing — Hard',
    difficulty: 'Hard',
    mechanic: 'Thailand · picture → written word',
    what: 'Shows a picture. The student picks the written form of that word from four choices (no audio cue).',
    good: 'Reading practice. Students must recognise the Chinese characters without hearing the word.',
  },
  'taiwan-1-T': {
    title: 'Stroke order — Guided',
    difficulty: 'Easy',
    mechanic: 'Taiwan · stroke writing',
    what: 'The character outline is shown with numbered start dots. The student traces each stroke with finger or mouse. Forgiving accuracy.',
    good: 'First time learning to write a character. Maximum scaffolding.',
  },
  'taiwan-2-T': {
    title: 'Stroke order — Outline',
    difficulty: 'Medium',
    mechanic: 'Taiwan · stroke writing',
    what: 'The character outline is still shown but the numbered start dots are removed. Default stroke accuracy.',
    good: 'Students who remember the stroke sequence but still need the shape to copy.',
  },
  'taiwan-3-T': {
    title: 'Stroke order — From memory',
    difficulty: 'Hard',
    mechanic: 'Taiwan · stroke writing',
    what: 'No outline shown. The student writes the character from memory on a blank canvas. Strict stroke matching.',
    good: 'Production-level writing. Students who already know the character and want to prove it.',
  },
  'georgia-1-S': {
    title: 'First-syllable identification',
    difficulty: 'Medium',
    mechanic: 'Georgia · syllable choice',
    what: 'Plays a Cantonese word, then plays its first character on its own. The student picks that first character from six choices.',
    good: 'Hearing where one syllable ends and the next begins — useful for any student moving from listening to reading.',
  },
};

const DIFFICULTY_STYLES: Record<DoorContent['difficulty'], string> = {
  Easy: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  Hard: 'bg-rose-100 text-rose-700',
};

export function CantoneseGuide() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <a href="#" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">AlphaTilesAgain</span>
        </a>
        <div className="hidden md:flex space-x-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-primary transition-colors">← Home</a>
          <a href="./yueCantonese/" className="hover:text-primary transition-colors">Launch Cantonese build</a>
        </div>
      </nav>

      <main className="flex-grow px-6 py-12 md:py-20 max-w-5xl mx-auto w-full">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl font-bold">粵</div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Cantonese game guide</h1>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed">
            The Cantonese build ships with {YUE_GAME_ROWS.length} games (doors). This page describes what each door does and who it's a good fit for, so a reviewer or teacher can point students at the right one.
          </p>
          <p className="text-sm text-slate-500 mt-4">
            To open a specific door directly, launch the Cantonese build and tap that numbered tile on the main menu.
          </p>
          <div className="mt-6">
            <a
              href="./yueCantonese/"
              className="inline-block bg-primary text-white px-5 py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              Launch Cantonese build →
            </a>
          </div>
        </header>

        <section className="space-y-4">
          {YUE_GAME_ROWS.map((row) => {
            const content = DOOR_CONTENT[doorContentKey(row)];
            return (
              <article
                key={row.index}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8"
              >
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl md:text-2xl font-bold">
                    {row.index}
                  </div>
                  <div className="flex-grow min-w-0">
                    {content ? (
                      <>
                        <div className="flex flex-wrap items-baseline gap-3 mb-2">
                          <h2 className="text-xl md:text-2xl font-bold text-slate-900">{content.title}</h2>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[content.difficulty]}`}
                          >
                            {content.difficulty}
                          </span>
                        </div>
                        <p className="text-sm font-mono text-slate-500 mb-3">{content.mechanic}</p>
                        <p className="text-slate-700 leading-relaxed mb-3">
                          <span className="font-semibold text-slate-900">What it does:</span> {content.what}
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          <span className="font-semibold text-slate-900">Good for:</span> {content.good}
                        </p>
                      </>
                    ) : (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4">
                        <p className="font-semibold mb-1">No description for this door yet.</p>
                        <p className="text-sm font-mono">
                          {row.country} · CL {row.challengeLevel} · {row.syllOrTile}
                        </p>
                        <p className="text-sm mt-2">
                          Add an entry to <code className="font-mono">DOOR_CONTENT</code> in
                          {' '}<code className="font-mono">apps/home/src/app/cantoneseGuide.tsx</code> keyed by
                          {' '}<code className="font-mono">{doorContentKey(row)}</code>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-16 bg-slate-900 text-white rounded-2xl p-8 md:p-10">
          <h2 className="text-2xl font-bold mb-4">Quick suggestions for reviewers</h2>
          <ul className="space-y-3 text-slate-200 leading-relaxed">
            <li>
              <span className="font-semibold text-white">Brand-new to Cantonese:</span> start with door 1, then 2, then 6.
            </li>
            <li>
              <span className="font-semibold text-white">Knows some spoken vocabulary, learning to read:</span> doors 4 and 5.
            </li>
            <li>
              <span className="font-semibold text-white">Ready to listen carefully:</span> doors 2, 3, then 9.
            </li>
            <li>
              <span className="font-semibold text-white">Learning to write characters:</span> doors 6 → 7 → 8 on the same character.
            </li>
          </ul>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <a href="#" className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold text-xs">A</div>
            <span className="font-bold text-slate-800">AlphaTilesAgain</span>
          </a>
          <div className="text-slate-500 text-sm">
            © 2026 AlphaTilesAgain. Built on{' '}
            <a href="https://alphatilesapps.org" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 underline">
              AlphaTiles
            </a>
            .
          </div>
        </div>
      </footer>
    </div>
  );
}
