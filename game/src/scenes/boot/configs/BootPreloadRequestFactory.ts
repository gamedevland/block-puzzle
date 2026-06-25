export interface BootPreloadRequest {
  readonly configBundles: readonly string[];
  readonly assetBundles: readonly string[];
}

export class BootPreloadRequestFactory {
  static createGameEntryRequest(): BootPreloadRequest {
    return {
      configBundles: ['configs'],
      assetBundles: [
        'layouts',
        'prefabs',
        'images',
        'fonts',
        'audio-music',
        'audio-sfx',
      ],
    };
  }
}
