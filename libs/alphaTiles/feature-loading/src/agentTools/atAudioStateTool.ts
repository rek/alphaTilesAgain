import { defineAgentTool } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';

export const atAudioStateTool = (deps: Pick<AgentDeps, 'probe'>) =>
  defineAgentTool({
    name: 'at_audio_state',
    description:
      'Web audio: whether the tap-to-begin gate has unlocked audio, how many pack clips were played since load, and the last one (category:id, ms ago).',
    inputSchema: { type: 'object' },
    readOnly: true,
    run: async () => {
      const { audioUnlocked, clipsPlayed, lastClip } = deps.probe();
      return {
        audioUnlocked,
        clipsPlayed,
        lastClip: lastClip && { key: lastClip.key, msAgo: Date.now() - lastClip.at },
      };
    },
  });
