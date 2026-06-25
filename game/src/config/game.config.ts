import { BootSceneDefinition } from '../scenes/boot/configs/scene.config';
import { GameSceneDefinition } from '../scenes/game/configs/scene.config';

import { BlockPuzzleAssetsManifest } from './assets.manifest';
import { BlockPuzzleDiDefinitionRoot } from './BlockPuzzleDiDefinitionRoot';

import type { GameConfig } from '@gamedevland/engine/core';

export class BlockPuzzleGameConfig {
  static readonly config: GameConfig = {
    system: {
      canvasBackground: '#1d57c8',
      screen: {
        land: { width: 960, height: 540 },
        port: { width: 540, height: 960 },
        dpr: 'auto',
        maxDpr: 2,
      },
      boot: {
        configs: {
          engineStartBundles: ['configs'],
        },
      },
      persistence: {
        namespace: 'block-puzzle',
        localStorage: {
          enabled: true,
        },
        indexedDB: {
          enabled: true,
          databaseName: 'block-puzzle',
        },
      },
    },
    assets: {
      bundles: BlockPuzzleAssetsManifest.bundles,
      preload: ['configs'],
    },
    scenes: {
      initial: 'boot',
      map: {
        boot: BootSceneDefinition.config,
        game: GameSceneDefinition.config,
      },
    },
    di: new BlockPuzzleDiDefinitionRoot(),
  };
}
