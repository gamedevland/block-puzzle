import {
  PersistentStorageAdapter,
  StorageNamespace,
  TypedStateStore,
} from '@gamedevland/engine/configs';
import { DiTokens, GlobalDiDefinition } from '@gamedevland/engine/di';
import {
  Container as ContainerNode,
  Graphics as GraphicsNode,
  PlayParticlesAction,
  ResponsiveLayoutComponent,
  Sprite as SpriteNode,
  Text as TextNode,
} from '@gamedevland/engine/layouts';

import { CommonServices } from '../common/CommonServices';
import { CommonSchemas } from '../common/configs/schemas';
import { BlockPuzzlePlayerProgressService } from '../common/services/BlockPuzzlePlayerProgressService';
import { BlockPuzzlePlayerProgressStateStore } from '../common/services/BlockPuzzlePlayerProgressStateStore';
import { BlockPuzzleProgressStateService } from '../common/services/BlockPuzzleProgressStateService';
import { DebugDiTokens } from '../debug/di/DebugDiTokens';
import { DebugApiHostService } from '../debug/services/DebugApiHostService';
import { FailBootPreloadCommand } from '../scenes/boot/commands/FailBootPreloadCommand';
import { OpenGameSceneCommand } from '../scenes/boot/commands/OpenGameSceneCommand';
import { PreloadBootResourcesCommand } from '../scenes/boot/commands/PreloadBootResourcesCommand';
import { CheckBlockPuzzleMovesCommand } from '../scenes/game/commands/CheckBlockPuzzleMovesCommand';
import { HandleBlockPuzzleGameOverCommand } from '../scenes/game/commands/HandleBlockPuzzleGameOverCommand';
import { PlaceBlockCommand } from '../scenes/game/commands/PlaceBlockCommand';
import { RestartBlockPuzzleCommand } from '../scenes/game/commands/RestartBlockPuzzleCommand';
import { StartBlockPuzzleMusicCommand } from '../scenes/game/commands/StartBlockPuzzleMusicCommand';
import { StartBlockPuzzleSessionCommand } from '../scenes/game/commands/StartBlockPuzzleSessionCommand';
import { BlockPuzzleBoardComponent } from '../scenes/game/components/BlockPuzzleBoardComponent';
import { BlockPuzzleBoardEffectsComponent } from '../scenes/game/components/BlockPuzzleBoardEffectsComponent';
import { BlockPuzzleDragComponent } from '../scenes/game/components/BlockPuzzleDragComponent';
import { BlockPuzzleLayoutComponent } from '../scenes/game/components/BlockPuzzleLayoutComponent';
import { BlockPuzzleResultPopupComponent } from '../scenes/game/components/BlockPuzzleResultPopupComponent';
import { BlockPuzzleScoreComponent } from '../scenes/game/components/BlockPuzzleScoreComponent';
import { BlockPuzzleSlotsComponent } from '../scenes/game/components/BlockPuzzleSlotsComponent';

import type { BlockPuzzlePlayerProgress } from '../common/configs/types';
import type { BlockPuzzlePlayerProgressRepository } from '../common/services/BlockPuzzlePlayerProgressRepository';
import type {
  CommandsGroup,
  ComponentsGroup,
  ElementFactoriesGroup,
  ValuesGroupRegistrar,
} from '@gamedevland/engine/di';
import type { BaseAction } from '@gamedevland/engine/layouts';

export class BlockPuzzleGlobalDi extends GlobalDiDefinition {
  protected override registerElements(group: ElementFactoriesGroup): void {
    group
      .add('Container', ContainerNode)
      .add('Graphics', GraphicsNode)
      .add('Sprite', SpriteNode)
      .add('Text', TextNode);
  }

  protected override registerComponents(group: ComponentsGroup): void {
    group
      .add('ResponsiveLayoutComponent', ResponsiveLayoutComponent)
      .add('BlockPuzzleBoardEffectsComponent', BlockPuzzleBoardEffectsComponent)
      .add('BlockPuzzleBoardComponent', BlockPuzzleBoardComponent)
      .add('BlockPuzzleDragComponent', BlockPuzzleDragComponent)
      .add('BlockPuzzleLayoutComponent', BlockPuzzleLayoutComponent)
      .add('BlockPuzzleResultPopupComponent', BlockPuzzleResultPopupComponent)
      .add('BlockPuzzleScoreComponent', BlockPuzzleScoreComponent)
      .add('BlockPuzzleSlotsComponent', BlockPuzzleSlotsComponent);
  }

  protected override registerCommands(group: CommandsGroup): void {
    group
      .add('CheckBlockPuzzleMovesCommand', CheckBlockPuzzleMovesCommand)
      .add('FailBootPreloadCommand', FailBootPreloadCommand)
      .add('HandleBlockPuzzleGameOverCommand', HandleBlockPuzzleGameOverCommand)
      .add('OpenGameSceneCommand', OpenGameSceneCommand)
      .add('PreloadBootResourcesCommand', PreloadBootResourcesCommand)
      .add('PlaceBlockCommand', PlaceBlockCommand)
      .add('RestartBlockPuzzleCommand', RestartBlockPuzzleCommand)
      .add('StartBlockPuzzleSessionCommand', StartBlockPuzzleSessionCommand)
      .add('StartBlockPuzzleMusicCommand', StartBlockPuzzleMusicCommand);
  }

  protected override registerServices(registrar: ValuesGroupRegistrar): void {
    registrar.singletonClass(
      DebugDiTokens.DebugApiHostService,
      DebugApiHostService,
    );
    registrar.singletonClass(
      CommonServices.ProgressState,
      BlockPuzzleProgressStateService,
    );
    registrar.singletonFactory(
      CommonServices.ProgressRepository,
      (container) =>
        new BlockPuzzlePlayerProgressStateStore(
          new TypedStateStore<BlockPuzzlePlayerProgress>({
            adapter: new PersistentStorageAdapter(),
            namespace: new StorageNamespace('block-puzzle'),
            key: 'player-progress-v1',
            decoder: CommonSchemas.PLAYER_PROGRESS,
            defaults: () =>
              container
                .get<BlockPuzzleProgressStateService>(
                  CommonServices.ProgressState,
                )
                .createInitialProgress(),
          }),
          container.get<BlockPuzzleProgressStateService>(
            CommonServices.ProgressState,
          ),
        ),
    );
    registrar.singletonFactory(
      CommonServices.Progress,
      (container) =>
        new BlockPuzzlePlayerProgressService(
          container.get<BlockPuzzlePlayerProgressRepository>(
            CommonServices.ProgressRepository,
          ),
          container.get<BlockPuzzleProgressStateService>(
            CommonServices.ProgressState,
          ),
        ),
    );
    registrar.transientClass<BaseAction>(
      DiTokens.action('PlayParticlesAction'),
      PlayParticlesAction,
    );
  }
}
