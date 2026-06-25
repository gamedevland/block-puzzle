import type { CommonSchemas } from './schemas';
import type { InferDecoded } from '@gamedevland/engine/validation';

export type BlockPuzzlePlayerProgress = InferDecoded<
  typeof CommonSchemas.PLAYER_PROGRESS
>;
