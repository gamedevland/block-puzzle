import { DiTokens } from '@gamedevland/engine/di';

import type { GameDevtoolsApiService } from '../scenes/game/services/GameDevtoolsApiService';
import type { DebugApiHostService } from '../services/DebugApiHostService';

export class DebugDiTokens {
  static readonly DebugApiHostService =
    DiTokens.service<DebugApiHostService>('DebugApiHostService');

  static readonly GameDevtoolsApiService =
    DiTokens.service<GameDevtoolsApiService>('GameDevtoolsApiService');
}
