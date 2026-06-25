import { BaseCommand } from '@gamedevland/engine/commands';

import { BootServices } from '../configs/BootServices';

import type { BootPreloadService } from '../services/BootPreloadService';

export class PreloadBootResourcesCommand extends BaseCommand {
  override run(): void {
    this.getSceneService<BootPreloadService>(BootServices.Preload).start();
  }
}
