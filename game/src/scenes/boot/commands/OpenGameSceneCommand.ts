import { BaseCommand } from '@gamedevland/engine/commands';

export class OpenGameSceneCommand extends BaseCommand {
  override async run(): Promise<void> {
    await this.engine.scenes.start('game');
  }
}
