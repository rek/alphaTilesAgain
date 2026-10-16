import { registerAgentTools } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';
import { atAudioStateTool } from './atAudioStateTool';
import { atDoorsTool } from './atDoorsTool';
import { atGameAnswerTool } from './atGameAnswerTool';
import { atGameStateTool } from './atGameStateTool';
import { atLocationTool } from './atLocationTool';
import { atNavigateTool } from './atNavigateTool';
import { atPlayersTool } from './atPlayersTool';
import { atSettingsTool } from './atSettingsTool';

/**
 * The whole alphaTiles agent tool set (web, dev only; see AgentToolsBridge).
 * A new tool is one file plus one entry here.
 */
export const alphaTilesAgentTools = (deps: AgentDeps) => [
  atLocationTool(),
  atNavigateTool(deps),
  atPlayersTool(deps),
  atDoorsTool(deps),
  atGameStateTool(deps),
  atGameAnswerTool(deps),
  atAudioStateTool(deps),
  atSettingsTool(deps),
];

export const registerAlphaTilesAgentTools = (
  deps: AgentDeps,
  modelContext?: Parameters<typeof registerAgentTools>[1],
) => registerAgentTools(alphaTilesAgentTools(deps), modelContext);
