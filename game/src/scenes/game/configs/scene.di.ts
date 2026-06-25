import {
  SceneDiDefinition,
  SystemServices,
} from '@gamedevland/engine/di';

import { CommonServices } from '../../../common/CommonServices';
import { DebugDiTokens } from '../../../debug/di/DebugDiTokens';
import { GameDevtoolsApiService } from '../../../debug/scenes/game/services/GameDevtoolsApiService';
import { BlockPuzzleServices } from '../BlockPuzzleServices';
import { BlockPuzzleAudioService } from '../services/BlockPuzzleAudioService';
import { BlockPuzzleGameplayService } from '../services/BlockPuzzleGameplayService';
import { BlockPuzzleGeometryService } from '../services/BlockPuzzleGeometryService';

import { BlockPuzzleConfigEntries } from './schemas';

import type { BlockPuzzlePlayerProgressService } from '../../../common/services/BlockPuzzlePlayerProgressService';
import type { DebugApiHostService } from '../../../debug/services/DebugApiHostService';
import type { ConfigStore } from '@gamedevland/engine/configs';
import type { SceneServiceTokenRegistry, ValuesGroupRegistrar } from '@gamedevland/engine/di';

export class GameSceneDi extends SceneDiDefinition {
  override getSceneKey(): string {
    return 'game';
  }

  protected override registerProviders(registrar: ValuesGroupRegistrar): void {
    registrar.singletonFactory(BlockPuzzleServices.Gameplay, (container) => {
      const configs = container.get<ConfigStore>(SystemServices.ConfigStore);
      return new BlockPuzzleGameplayService(
        configs.get(
          BlockPuzzleConfigEntries.Board.fileId,
          BlockPuzzleConfigEntries.Board.decoder,
        ),
        configs.get(
          BlockPuzzleConfigEntries.Shapes.fileId,
          BlockPuzzleConfigEntries.Shapes.decoder,
        ),
        configs.get(
          BlockPuzzleConfigEntries.Scoring.fileId,
          BlockPuzzleConfigEntries.Scoring.decoder,
        ),
        container.get<BlockPuzzlePlayerProgressService>(
          CommonServices.Progress,
        ),
      );
    });
    registrar.singletonClass(BlockPuzzleServices.Audio, BlockPuzzleAudioService);
    registrar.singletonFactory(BlockPuzzleServices.Geometry, (container) => {
      const configs = container.get<ConfigStore>(SystemServices.ConfigStore);
      return new BlockPuzzleGeometryService(
        configs.get(
          BlockPuzzleConfigEntries.Board.fileId,
          BlockPuzzleConfigEntries.Board.decoder,
        ),
        configs.get(
          BlockPuzzleConfigEntries.Geometry.fileId,
          BlockPuzzleConfigEntries.Geometry.decoder,
        ),
      );
    });
    registrar.singletonFactory(
      DebugDiTokens.GameDevtoolsApiService,
      (container) =>
        new GameDevtoolsApiService(
          container.get<DebugApiHostService>(
            DebugDiTokens.DebugApiHostService,
          ),
        ),
    );
  }

  protected override registerServices(services: SceneServiceTokenRegistry): void {
    services
      .add(BlockPuzzleServices.Gameplay)
      .add(BlockPuzzleServices.Audio)
      .add(DebugDiTokens.GameDevtoolsApiService);
  }
}
