import { FsmDrivenSceneLifecycleEvents } from '@gamedevland/engine/scenes';

import { BootEvents } from './events';

import type { FSMConfig } from '@gamedevland/engine/fsm';

export class BootFsm {
  static readonly config: FSMConfig = {
    initial: 'bootstrapping',
    states: {
      bootstrapping: {
        on: {
          [FsmDrivenSceneLifecycleEvents.SceneReady]: {
            target: 'ready',
          },
        },
      },
      ready: {
        on: {
          [FsmDrivenSceneLifecycleEvents.SceneTick]: {
            target: 'loading',
            actions: ['PreloadBootResourcesCommand'],
          },
        },
      },
      loading: {
        on: {
          [BootEvents.PreloadCompleted]: {
            target: 'exiting',
            actions: ['OpenGameSceneCommand'],
          },
          [BootEvents.PreloadFailed]: {
            target: 'failed',
            actions: ['FailBootPreloadCommand'],
          },
        },
      },
      exiting: {},
      failed: {},
    },
  };
}
