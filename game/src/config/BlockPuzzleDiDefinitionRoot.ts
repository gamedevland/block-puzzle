import { GameDiDefinition } from '@gamedevland/engine/di';

import { BootSceneDi } from '../scenes/boot/configs/scene.di';
import { GameSceneDi } from '../scenes/game/configs/scene.di';

import { BlockPuzzleGlobalDi } from './di.providers';

import type { GlobalDiDefinition, SceneDiDefinition } from '@gamedevland/engine/di';

export class BlockPuzzleDiDefinitionRoot extends GameDiDefinition {
  protected override createGlobalDefinition(): GlobalDiDefinition {
    return new BlockPuzzleGlobalDi();
  }

  protected override createSceneDefinitions(): readonly SceneDiDefinition[] {
    return [new BootSceneDi(), new GameSceneDi()];
  }
}
