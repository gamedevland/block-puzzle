import { BaseSceneService } from '@gamedevland/engine/scenes';

import { CommonSchemas } from '../../../common/configs/schemas';
import { BootPreloadRequestFactory } from '../configs/BootPreloadRequestFactory';
import { BootEvents } from '../configs/events';

import type { AssetManager } from '@gamedevland/engine/assets';
import type { ConfigStore } from '@gamedevland/engine/configs';
import type { SceneServiceContext } from '@gamedevland/engine/scenes';

type BootPreloadState = 'idle' | 'loading' | 'completed' | 'failed';

export class BootPreloadService extends BaseSceneService {
  private state: BootPreloadState = 'idle';
  private active = false;
  private failure: Error | undefined;

  constructor(
    private readonly assets: AssetManager,
    private readonly configStore: ConfigStore,
  ) {
    super();
  }

  start(): void {
    if (this.state === 'loading' || this.state === 'completed') {
      return;
    }
    if (this.state === 'failed') {
      throw this.getFailure();
    }

    this.state = 'loading';
    void this.runPreload();
  }

  getFailure(): Error {
    return this.failure
      ?? new Error('BootPreloadService: preload failed without captured error');
  }

  protected override onEnter(_ctx: SceneServiceContext): void {
    this.active = true;
  }

  protected override onExit(_ctx: SceneServiceContext): void {
    this.active = false;
  }

  private async runPreload(): Promise<void> {
    try {
      const request = BootPreloadRequestFactory.createGameEntryRequest();
      await this.sceneContext.engine.bootstrapConfigBundles(request.configBundles);
      for (const bundleName of request.assetBundles) {
        await this.assets.loadBundle(bundleName);
      }
      this.applyAudioVolumeConfig();
      if (!this.active) return;

      this.state = 'completed';
      this.sceneContext.engine.events.emit({
        type: BootEvents.PreloadCompleted,
        data: {},
      });
    } catch (error) {
      this.failure = this.normalizeFailure(error);
      if (!this.active) return;

      this.state = 'failed';
      this.sceneContext.engine.events.emit({
        type: BootEvents.PreloadFailed,
        data: {},
      });
    }
  }

  private applyAudioVolumeConfig(): void {
    this.sceneContext.engine.audio.applyBootstrapConfig(
      { volumeConfigId: CommonSchemas.SOUNDS_CONFIG_FILE },
      this.configStore,
    );
  }

  private normalizeFailure(error: unknown): Error {
    return error instanceof Error
      ? error
      : new Error('BootPreloadService: preload failed with non-error rejection');
  }
}
