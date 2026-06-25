import { BootScene } from '../../BootScene';

import { BootFsm } from './fsm.config';

import type { SceneConfig } from '@gamedevland/engine/core';

export class BootSceneDefinition {
  static readonly config: SceneConfig = {
    key: 'boot',
    useClass: BootScene,
    layout: 'json/layouts/scenes/boot/layout.json',
    fsm: BootFsm.config,
  };
}
