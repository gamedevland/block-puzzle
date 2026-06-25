import { FsmDrivenSceneLifecycleEvents } from '@gamedevland/engine/scenes';

import { BlockPuzzleEvents } from './events';

import type { FSMConfig } from '@gamedevland/engine/fsm';

export class GameFsm {
  static readonly config: FSMConfig = {
    initial: 'bootstrapping',
    states: {
      bootstrapping: {
        on: {
          [FsmDrivenSceneLifecycleEvents.SceneReady]: {
            target: 'starting',
            actions: [
              'StartBlockPuzzleSessionCommand',
              'StartBlockPuzzleMusicCommand',
            ],
          },
        },
      },
      starting: {
        on: {
          [BlockPuzzleEvents.SessionStarted]: {
            target: 'playing',
          },
        },
      },
      playing: {
        on: {
          [BlockPuzzleEvents.PlacementRequested]: {
            target: 'resolvingPlacement',
            actions: ['PlaceBlockCommand'],
          },
          [BlockPuzzleEvents.RestartRequested]: {
            actions: ['RestartBlockPuzzleCommand'],
          },
        },
      },
      resolvingPlacement: {
        on: {
          [BlockPuzzleEvents.PlacementCompleted]: {
            target: 'checkingMoves',
          },
          [BlockPuzzleEvents.PlacementRejected]: {
            target: 'playing',
          },
          [BlockPuzzleEvents.RestartRequested]: {
            actions: ['RestartBlockPuzzleCommand'],
          },
        },
      },
      checkingMoves: {
        entry: ['CheckBlockPuzzleMovesCommand'],
        on: {
          [BlockPuzzleEvents.MovesAvailable]: {
            target: 'playing',
          },
          [BlockPuzzleEvents.GameOver]: {
            target: 'ended',
            actions: ['HandleBlockPuzzleGameOverCommand'],
          },
          [BlockPuzzleEvents.RestartRequested]: {
            actions: ['RestartBlockPuzzleCommand'],
          },
        },
      },
      ended: {
        on: {
          [BlockPuzzleEvents.RestartRequested]: {
            actions: ['RestartBlockPuzzleCommand'],
          },
        },
      },
    },
  };
}
