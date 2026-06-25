export class BlockPuzzleEvents {
  static readonly SessionStarted = 'BLOCK_PUZZLE_SESSION_STARTED';
  static readonly BoardChanged = 'BLOCK_PUZZLE_BOARD_CHANGED';
  static readonly BlocksChanged = 'BLOCK_PUZZLE_BLOCKS_CHANGED';
  static readonly SlotPressed = 'BLOCK_PUZZLE_SLOT_PRESSED';
  static readonly DragStarted = 'BLOCK_PUZZLE_DRAG_STARTED';
  static readonly DragCancelled = 'BLOCK_PUZZLE_DRAG_CANCELLED';
  static readonly PreviewChanged = 'BLOCK_PUZZLE_PREVIEW_CHANGED';
  static readonly PlacementRequested = 'BLOCK_PUZZLE_PLACEMENT_REQUESTED';
  static readonly PlacementCompleted = 'BLOCK_PUZZLE_PLACEMENT_COMPLETED';
  static readonly PlacementRejected = 'BLOCK_PUZZLE_PLACEMENT_REJECTED';
  static readonly InvalidDrop = 'BLOCK_PUZZLE_INVALID_DROP';
  static readonly LinesCleared = 'BLOCK_PUZZLE_LINES_CLEARED';
  static readonly ScoreChanged = 'BLOCK_PUZZLE_SCORE_CHANGED';
  static readonly MovesAvailable = 'BLOCK_PUZZLE_MOVES_AVAILABLE';
  static readonly GameOver = 'BLOCK_PUZZLE_GAME_OVER';
  static readonly ResultReady = 'BLOCK_PUZZLE_RESULT_READY';
  static readonly RestartRequested = 'BLOCK_PUZZLE_RESTART_REQUESTED';
}
