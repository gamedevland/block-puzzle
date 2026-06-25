import { BlockPuzzleEvents } from '../../../../scenes/game/configs/events';

import type { GameDebugApi } from '../../../api/types';
import type { DebugApiHostService } from '../../../services/DebugApiHostService';
import type {
  SceneService,
  SceneServiceContext,
} from '@gamedevland/engine/scenes';

export class GameDevtoolsApiService implements SceneService {
  private static readonly DefaultScore = 1280;
  private static readonly DefaultBestScore = 2048;

  private cleanupWindowHook: (() => void) | undefined;

  constructor(private readonly debugApiHost: DebugApiHostService) {}

  onSceneEnter(ctx: SceneServiceContext): void {
    const gameApi: GameDebugApi = {
      showGameOverPopup: (score?: number, bestScore?: number) =>
        this.showGameOverPopup(ctx, score, bestScore),
    };
    this.cleanupWindowHook = this.debugApiHost.registerGameApi(gameApi);
  }

  onSceneExit(_ctx: SceneServiceContext): void {
    this.cleanupWindowHook?.();
    this.cleanupWindowHook = undefined;
  }

  private showGameOverPopup(
    ctx: SceneServiceContext,
    score: number = GameDevtoolsApiService.DefaultScore,
    bestScore: number = GameDevtoolsApiService.DefaultBestScore,
  ): Promise<string> {
    const resolvedBestScore = Math.max(score, bestScore);
    ctx.engine.events.emit({
      type: BlockPuzzleEvents.ResultReady,
      data: {
        score,
        bestScore: resolvedBestScore,
        isNewBest: score > bestScore,
      },
    });

    return Promise.resolve(
      `Game over popup requested: score=${score}, bestScore=${resolvedBestScore}.`,
    );
  }
}
