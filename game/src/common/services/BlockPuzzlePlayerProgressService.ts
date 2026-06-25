import type { BlockPuzzlePlayerProgressRepository } from './BlockPuzzlePlayerProgressRepository';
import type { BlockPuzzleProgressStateService } from './BlockPuzzleProgressStateService';
import type { BlockPuzzlePlayerProgress } from '../configs/types';

export class BlockPuzzlePlayerProgressService {
  constructor(
    private readonly repository: BlockPuzzlePlayerProgressRepository,
    private readonly progressState: BlockPuzzleProgressStateService,
  ) {}

  load(): BlockPuzzlePlayerProgress {
    return this.repository.load();
  }

  setBestScore(score: number): BlockPuzzlePlayerProgress {
    const next = this.progressState.setBestScore(
      this.repository.load(),
      score,
    );
    this.repository.save(next);
    return next;
  }
}
