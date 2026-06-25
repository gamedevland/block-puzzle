import { FsmDrivenScene } from '@gamedevland/engine/scenes';

import type { SceneConfig } from '@gamedevland/engine/core';

export class GameScene extends FsmDrivenScene {
  constructor(config: SceneConfig) {
    super(config);
  }
}
