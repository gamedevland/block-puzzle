import { FsmDrivenScene } from '@gamedevland/engine/scenes';

import type { SceneConfig } from '@gamedevland/engine/core';

export class BootScene extends FsmDrivenScene {
  constructor(config: SceneConfig) {
    super(config);
  }
}
