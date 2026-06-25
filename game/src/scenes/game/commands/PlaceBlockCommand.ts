import { BaseTypedCommand } from '@gamedevland/engine/commands';

import { BlockPuzzleServices } from '../BlockPuzzleServices';
import { BlockPuzzleEventSchemas } from '../configs/event.schemas';

import type { InferDecoded } from '@gamedevland/engine/validation';

type PlaceBlockCommandPayload = InferDecoded<
  typeof BlockPuzzleEventSchemas.PlacementRequest
>;

export class PlaceBlockCommand extends BaseTypedCommand<PlaceBlockCommandPayload> {
  protected override readonly inputDecoder =
    BlockPuzzleEventSchemas.PlacementRequest;

  protected override execute(payload: PlaceBlockCommandPayload): void {
    this.getSceneService(BlockPuzzleServices.Gameplay).place(payload);
  }
}
