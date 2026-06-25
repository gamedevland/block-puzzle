import type { BlockPuzzlePlayerProgress } from '../configs/types';

export interface BlockPuzzlePlayerProgressRepository {
  load(): BlockPuzzlePlayerProgress;
  save(progress: BlockPuzzlePlayerProgress): void;
}
