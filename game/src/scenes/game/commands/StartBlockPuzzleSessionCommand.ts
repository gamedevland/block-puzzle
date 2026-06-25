import { BaseCommand } from '@gamedevland/engine/commands';

import { BlockPuzzleServices } from '../BlockPuzzleServices';

export class StartBlockPuzzleSessionCommand extends BaseCommand {
  override run(): void {
    this.getSceneService(BlockPuzzleServices.Gameplay).startSession();
  }
}
