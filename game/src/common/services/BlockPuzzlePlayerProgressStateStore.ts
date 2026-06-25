import type { BlockPuzzlePlayerProgressRepository } from './BlockPuzzlePlayerProgressRepository';
import type { BlockPuzzleProgressStateService } from './BlockPuzzleProgressStateService';
import type { BlockPuzzlePlayerProgress } from '../configs/types';
import type { TypedStateStore } from '@gamedevland/engine/configs';

export class BlockPuzzlePlayerProgressStateStore
  implements BlockPuzzlePlayerProgressRepository
{
  constructor(
    private readonly store: TypedStateStore<BlockPuzzlePlayerProgress>,
    private readonly progressState: BlockPuzzleProgressStateService,
  ) {}

  load(): BlockPuzzlePlayerProgress {
    return this.progressState.normalizeProgress(this.store.load());
  }

  save(progress: BlockPuzzlePlayerProgress): void {
    this.store.save(this.progressState.normalizeProgress(progress));
  }
}
