import type { DebugApiRoot, DebugWindow, GameDebugApi } from '../api/types';

export class DebugApiHostService {
  registerGameApi(gameApi: GameDebugApi): () => void {
    const debugWindow = window as DebugWindow;
    const root = this.getOrCreateRoot(debugWindow);
    const previousGameApi = root.game;
    root.game = gameApi;

    return () => {
      if (root.game === gameApi) {
        if (previousGameApi !== undefined) {
          root.game = previousGameApi;
        } else {
          delete root.game;
        }
      }

      if (root.game === undefined && debugWindow.__blockPuzzleDebug === root) {
        delete debugWindow.__blockPuzzleDebug;
      }
    };
  }

  private getOrCreateRoot(debugWindow: DebugWindow): DebugApiRoot {
    const existing = debugWindow.__blockPuzzleDebug;
    if (existing !== undefined) {
      return existing;
    }

    const created: DebugApiRoot = {};
    debugWindow.__blockPuzzleDebug = created;
    return created;
  }
}
