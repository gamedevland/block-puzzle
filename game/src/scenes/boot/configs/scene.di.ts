import { SceneDiDefinition, SystemServices } from '@gamedevland/engine/di';

import { BootPreloadService } from '../services/BootPreloadService';

import { BootServices } from './BootServices';

import type { AssetManager } from '@gamedevland/engine/assets';
import type { ConfigStore } from '@gamedevland/engine/configs';
import type {
  DiContainerInterface,
  SceneServiceTokenRegistry,
  ValuesGroupRegistrar,
} from '@gamedevland/engine/di';

export class BootSceneDi extends SceneDiDefinition {
  override getSceneKey(): string {
    return 'boot';
  }

  protected override registerProviders(registrar: ValuesGroupRegistrar): void {
    registrar.singletonFactory(
      BootServices.Preload,
      (container: DiContainerInterface) =>
        new BootPreloadService(
          container.get<AssetManager>(SystemServices.AssetManager),
          container.get<ConfigStore>(SystemServices.ConfigStore),
        ),
    );
  }

  protected override registerServices(services: SceneServiceTokenRegistry): void {
    services.add(BootServices.Preload);
  }
}
