import { GameScene } from '../../GameScene';

import { GameFsm } from './fsm.config';

import type { SceneConfig } from '@gamedevland/engine/core';

export class GameSceneDefinition {
  static readonly config: SceneConfig = {
    key: 'game',
    useClass: GameScene,
    layout: 'json/layouts/scenes/game/layout.json',
    fsm: GameFsm.config,
  };
}
