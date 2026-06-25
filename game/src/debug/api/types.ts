export interface GameDebugApi {
  showGameOverPopup: (
    score?: number,
    bestScore?: number,
  ) => Promise<string>;
}

export interface DebugApiRoot {
  game?: GameDebugApi;
}

export type DebugWindow = Window & {
  __blockPuzzleDebug?: DebugApiRoot;
};
