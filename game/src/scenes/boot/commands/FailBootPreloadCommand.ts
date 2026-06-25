import { BaseCommand } from '@gamedevland/engine/commands';

import { BootServices } from '../configs/BootServices';

import type { BootPreloadService } from '../services/BootPreloadService';

export class FailBootPreloadCommand extends BaseCommand {
  override run(): never {
    throw this.getSceneService<BootPreloadService>(
      BootServices.Preload,
    ).getFailure();
  }
}
