import { CommonSchemas } from '../configs/schemas';

import type { BlockPuzzlePlayerProgress } from '../configs/types';

export class BlockPuzzleProgressStateService {
  createInitialProgress(): BlockPuzzlePlayerProgress {
    return {
      version: CommonSchemas.PLAYER_PROGRESS_VERSION,
      bestScore: 0,
    };
  }

  normalizeProgress(
    progress: BlockPuzzlePlayerProgress,
  ): BlockPuzzlePlayerProgress {
    return {
      version: CommonSchemas.PLAYER_PROGRESS_VERSION,
      bestScore: this.normalizeScore(progress.bestScore),
    };
  }

  setBestScore(
    progress: BlockPuzzlePlayerProgress,
    score: number,
  ): BlockPuzzlePlayerProgress {
    return this.normalizeProgress({
      version: progress.version,
      bestScore: Math.max(progress.bestScore, this.normalizeScore(score)),
    });
  }

  private normalizeScore(score: number): number {
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.trunc(score));
  }
}
