import { DiTokens } from '@gamedevland/engine/di';

import type { BootPreloadService } from '../services/BootPreloadService';

export class BootServices {
  static readonly Preload =
    DiTokens.service<BootPreloadService>('BootPreloadService');
}
