import { BaseCommand } from '@gamedevland/engine/commands';

import { BlockPuzzleServices } from '../BlockPuzzleServices';

export class CheckBlockPuzzleMovesCommand extends BaseCommand {
  override run(): void {
    this.getSceneService(BlockPuzzleServices.Gameplay).emitMoveAvailability();
  }
}
