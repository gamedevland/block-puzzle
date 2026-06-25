import { BaseCommand } from '@gamedevland/engine/commands';

import { BlockPuzzleServices } from '../BlockPuzzleServices';

export class StartBlockPuzzleMusicCommand extends BaseCommand {
  override run(): void {
    this.getSceneService(BlockPuzzleServices.Audio).startMusic();
  }
}
