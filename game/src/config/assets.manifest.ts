import { AssetManifestBuilder } from '@gamedevland/engine/assets';

import { BlockPuzzleAssetManifestPolicy } from './BlockPuzzleAssetManifestPolicy';

const configsJson = import.meta.glob('@game/assets/json/configs/**/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const localesJson = import.meta.glob('@game/assets/json/locales/**/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const layoutsJson = import.meta.glob('@game/assets/json/layouts/**/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const prefabsJson = import.meta.glob('@game/assets/json/prefabs/**/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const images = import.meta.glob('@game/assets/images/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const fonts = import.meta.glob('@game/assets/fonts/**/*.woff2', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const audio = import.meta.glob('@game/assets/sounds/**/*.{mp3,ogg,wav,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export class BlockPuzzleAssetsManifest {
  static readonly bundles = new AssetManifestBuilder({
    audio,
    configsJson,
    localesJson,
    layoutsJson,
    prefabsJson,
    images,
    fonts,
  }, {
    policy: new BlockPuzzleAssetManifestPolicy(),
  }).build();
}
