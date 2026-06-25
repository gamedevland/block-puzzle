import { DiTokens } from '@gamedevland/engine/di';

import type { BlockPuzzleAudioService } from './services/BlockPuzzleAudioService';
import type { BlockPuzzleGameplayService } from './services/BlockPuzzleGameplayService';
import type { BlockPuzzleGeometryService } from './services/BlockPuzzleGeometryService';

export class BlockPuzzleServices {
  static readonly Audio = DiTokens.service<BlockPuzzleAudioService>(
    'BlockPuzzleAudioService',
  );
  static readonly Gameplay = DiTokens.service<BlockPuzzleGameplayService>(
    'BlockPuzzleGameplayService',
  );
  static readonly Geometry = DiTokens.service<BlockPuzzleGeometryService>(
    'BlockPuzzleGeometryService',
  );
}
