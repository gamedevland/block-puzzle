import type {
  AssetGlobInput,
  AssetType,
  BundleBuildPolicy,
} from '@gamedevland/engine/assets';

interface BundleRule {
  readonly name: string;
  readonly type: AssetType;
  readonly files: Record<string, string>;
}

export class BlockPuzzleAssetManifestPolicy implements BundleBuildPolicy {
  createRules(input: AssetGlobInput): readonly BundleRule[] {
    return [
      {
        name: 'audio-music',
        type: 'audio',
        files: this.collectMusic(input.audio),
      },
      {
        name: 'audio-sfx',
        type: 'audio',
        files: this.collectSfx(input.audio),
      },
      { name: 'configs', type: 'json', files: input.configsJson },
      { name: 'locales', type: 'json', files: input.localesJson },
      { name: 'layouts', type: 'json', files: input.layoutsJson },
      { name: 'prefabs', type: 'json', files: input.prefabsJson },
      { name: 'images', type: 'image', files: input.images },
      { name: 'fonts', type: 'font', files: input.fonts },
    ];
  }

  private collectMusic(files: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(files).filter(([filePath]) =>
        filePath.endsWith('/assets/sounds/music.mp3'),
      ),
    );
  }

  private collectSfx(files: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(files).filter(
        ([filePath]) => !filePath.endsWith('/assets/sounds/music.mp3'),
      ),
    );
  }
}
