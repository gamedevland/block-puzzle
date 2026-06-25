import { DiTokens } from '@gamedevland/engine/di';

import type { BlockPuzzlePlayerProgressRepository } from './services/BlockPuzzlePlayerProgressRepository';
import type { BlockPuzzlePlayerProgressService } from './services/BlockPuzzlePlayerProgressService';
import type { BlockPuzzleProgressStateService } from './services/BlockPuzzleProgressStateService';

export class CommonServices {
  static readonly ProgressState =
    DiTokens.service<BlockPuzzleProgressStateService>(
      'BlockPuzzleProgressStateService',
    );
  static readonly ProgressRepository =
    DiTokens.service<BlockPuzzlePlayerProgressRepository>(
      'BlockPuzzlePlayerProgressRepository',
    );
  static readonly Progress =
    DiTokens.service<BlockPuzzlePlayerProgressService>(
      'BlockPuzzlePlayerProgressService',
    );
}
