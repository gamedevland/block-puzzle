import { BaseSceneService } from '@gamedevland/engine/scenes';

import { AudioAssetIds } from '../../../config/AudioAssetIds';
import { BlockPuzzleEvents } from '../configs/events';

import type { SceneServiceContext } from '@gamedevland/engine/scenes';

export class BlockPuzzleAudioService extends BaseSceneService {
  private readonly eventOffs: Array<() => void> = [];

  startMusic(): void {
    this.sceneContext.engine.audio.playMusic(AudioAssetIds.Music);
  }

  protected override onEnter(ctx: SceneServiceContext): void {
    this.eventOffs.push(
      ctx.engine.events.on(BlockPuzzleEvents.DragStarted, () => {
        this.playSfx(AudioAssetIds.Selected);
      }),
      ctx.engine.events.on(BlockPuzzleEvents.PlacementCompleted, () => {
        this.playSfx(AudioAssetIds.Placed);
      }),
      ctx.engine.events.on(BlockPuzzleEvents.LinesCleared, () => {
        this.playSfx(AudioAssetIds.Success);
      }),
      ctx.engine.events.on(BlockPuzzleEvents.PlacementRejected, () => {
        this.playSfx(AudioAssetIds.Fail);
      }),
      ctx.engine.events.on(BlockPuzzleEvents.InvalidDrop, () => {
        this.playSfx(AudioAssetIds.Fail);
      }),
    );
  }

  protected override onExit(_ctx: SceneServiceContext): void {
    for (const off of this.eventOffs) off();
    this.eventOffs.length = 0;
  }

  private playSfx(assetId: string): void {
    this.sceneContext.engine.audio.playSfx(assetId);
  }
}
