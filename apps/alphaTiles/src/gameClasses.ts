import type { ComponentType } from 'react';
import type { LangAssets } from '@alphaTiles/data-language-pack';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';
import { BrazilContainer, brazilPreProcess } from '@alphaTiles/feature-game-brazil';
import { ChileContainer, chilePreProcess } from '@alphaTiles/feature-game-chile';
import { ChinaContainer, buildChinaData } from '@alphaTiles/feature-game-china';
import { ColombiaContainer } from '@alphaTiles/feature-game-colombia';
import { EcuadorContainer } from '@alphaTiles/feature-game-ecuador';
import { GeorgiaContainer, georgiaPreProcess } from '@alphaTiles/feature-game-georgia';
import { IraqContainer } from '@alphaTiles/feature-game-iraq';
import { ItalyContainer } from '@alphaTiles/feature-game-italy';
import { JapanContainer } from '@alphaTiles/feature-game-japan';
import { MalaysiaContainer, malaysiaPreProcess } from '@alphaTiles/feature-game-malaysia';
import { MexicoContainer, buildMexicoData } from '@alphaTiles/feature-game-mexico';
import { MyanmarContainer } from '@alphaTiles/feature-game-myanmar';
import { PeruContainer } from '@alphaTiles/feature-game-peru';
import { RomaniaContainer, buildRomaniaData } from '@alphaTiles/feature-game-romania';
import { SudanContainer, buildSudanData } from '@alphaTiles/feature-game-sudan';
import { TaiwanContainer, buildTaiwanData } from '@alphaTiles/feature-game-taiwan';
import { ThailandContainer } from '@alphaTiles/feature-game-thailand';
import { UnitedStatesContainer, buildUnitedStatesData } from '@alphaTiles/feature-game-united-states';
import type { GameClassKey } from './gameClassKeys';

/** What the game route hands every container: route params + app chrome icons. */
export type GameContainerProps = Record<string, string | string[] | GameShellIcons | undefined> & {
  icons: GameShellIcons;
};

type GameClass = {
  /** Rendered by `app/games/[classKey].tsx` for every Door of this class. */
  Container: ComponentType<GameContainerProps>;
  /** Boot-time precompute; the container reads it via `usePrecompute(classKey)`. */
  precompute?: (assets: LangAssets) => unknown;
};

/**
 * Game-class registry — the one place a game class is wired into the app.
 * Adding a game = one key in `gameClassKeys.ts` + one entry here (the
 * `Record` type makes a missing or extra entry a compile error).
 *
 * Lives in the app because only the app may import every feature-game lib and
 * resolve app assets (`gameIcons`, injected once by the route).
 */
export const gameClasses: Record<GameClassKey, GameClass> = {
  brazil: { Container: BrazilContainer, precompute: brazilPreProcess },
  chile: { Container: ChileContainer, precompute: chilePreProcess },
  china: { Container: ChinaContainer, precompute: buildChinaData },
  colombia: { Container: ColombiaContainer },
  ecuador: { Container: EcuadorContainer },
  georgia: { Container: GeorgiaContainer, precompute: georgiaPreProcess },
  iraq: { Container: IraqContainer },
  italy: { Container: ItalyContainer },
  japan: { Container: JapanContainer },
  malaysia: { Container: MalaysiaContainer, precompute: malaysiaPreProcess },
  mexico: { Container: MexicoContainer, precompute: buildMexicoData },
  myanmar: { Container: MyanmarContainer },
  peru: { Container: PeruContainer },
  romania: { Container: RomaniaContainer, precompute: buildRomaniaData },
  sudan: { Container: SudanContainer, precompute: (assets) => buildSudanData(assets, 7) },
  taiwan: { Container: TaiwanContainer, precompute: buildTaiwanData },
  thailand: { Container: ThailandContainer },
  'united-states': { Container: UnitedStatesContainer, precompute: buildUnitedStatesData },
};
