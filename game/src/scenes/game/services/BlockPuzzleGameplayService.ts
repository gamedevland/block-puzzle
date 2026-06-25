import { BaseSceneService } from '@gamedevland/engine/scenes';

import { BlockPuzzleEvents } from '../configs/events';
import { BlockPuzzleBoard } from '../domain/BlockPuzzleBoard';
import { BlockPuzzleScoreRules } from '../domain/BlockPuzzleScoreRules';
import { BlockPuzzleShapeDeck } from '../domain/BlockPuzzleShapeDeck';
import { BlockPuzzleSlots } from '../domain/BlockPuzzleSlots';

import type { BlockPuzzlePlayerProgressService } from '../../../common/services/BlockPuzzlePlayerProgressService';
import type {
  BlockPuzzleBoardConfig,
  BlockPuzzleScoringConfig,
  BlockPuzzleShapesConfig,
} from '../configs/schemas';
import type {
  BoardSnapshot,
  CellCoordinate,
  MoveResult,
  PlacementPreview,
  PlacementRequest,
  ShapeDefinition,
  ShapeSlot,
} from '../domain/BlockPuzzleTypes';

interface BlockPuzzleSession {
  readonly board: BlockPuzzleBoard;
  readonly deck: BlockPuzzleShapeDeck;
  readonly slots: BlockPuzzleSlots;
  score: number;
  bestScore: number;
  ended: boolean;
}

export class BlockPuzzleGameplayService extends BaseSceneService {
  private session: BlockPuzzleSession | undefined;
  private readonly scoreRules: BlockPuzzleScoreRules;

  constructor(
    private readonly boardConfig: BlockPuzzleBoardConfig,
    private readonly shapesConfig: BlockPuzzleShapesConfig,
    scoringConfig: BlockPuzzleScoringConfig,
    private readonly progress: BlockPuzzlePlayerProgressService,
  ) {
    super();
    this.scoreRules = new BlockPuzzleScoreRules(scoringConfig);
  }

  startSession(): void {
    const deck = new BlockPuzzleShapeDeck(this.shapesConfig.shapes);
    const slots = new BlockPuzzleSlots();
    slots.replace(deck.draw(BlockPuzzleSlots.Count));
    const progress = this.progress.load();

    this.session = {
      board: new BlockPuzzleBoard(this.boardConfig.width, this.boardConfig.height),
      deck,
      slots,
      score: 0,
      bestScore: progress.bestScore,
      ended: false,
    };
    this.emitBoardChanged();
    this.emitBlocksChanged();
    this.emitScoreChanged(0);
    this.sceneContext.engine.events.emit({
      type: BlockPuzzleEvents.SessionStarted,
      data: {},
    });
  }

  getBoardSnapshot(): BoardSnapshot {
    return this.getSession().board.snapshot();
  }

  getBoardSize(): { readonly width: number; readonly height: number } {
    return {
      width: this.boardConfig.width,
      height: this.boardConfig.height,
    };
  }

  getSlotsSnapshot(): readonly ShapeSlot[] {
    return this.getSession().slots.snapshot();
  }

  getMaxShapeCellCount(): number {
    let maxCellCount = 0;
    for (const shape of this.shapesConfig.shapes) {
      maxCellCount = Math.max(maxCellCount, shape.cells.length);
    }
    return maxCellCount;
  }

  getShape(slotId: number): ShapeDefinition | null {
    return this.getSession().slots.get(slotId);
  }

  previewPlacement(slotId: number, anchor: CellCoordinate): PlacementPreview {
    const session = this.getSession();
    const shape = session.slots.get(slotId);
    if (shape === null) {
      return {
        valid: false,
        color: 0,
        cells: [],
        completedLines: { rows: [], columns: [] },
      };
    }
    return session.board.preview(shape, anchor);
  }

  place(request: PlacementRequest): void {
    const session = this.getSession();
    if (session.ended) return;
    const shape = session.slots.get(request.slotId);
    if (shape === null || !session.board.canPlace(shape, request.anchor)) {
      this.sceneContext.engine.events.emit({
        type: BlockPuzzleEvents.PlacementRejected,
        data: request,
      });
      return;
    }

    const placedCells = session.board.place(shape, request.anchor);
    session.slots.use(request.slotId);
    const completedLines = session.board.findCompletedLines();
    const clearedCells = session.board.collectCells(completedLines);
    const boardBeforeClear = session.board.snapshot();
    session.board.clear(clearedCells);
    const boardAfterClear = session.board.snapshot();
    const clearedLineCount =
      completedLines.rows.length + completedLines.columns.length;
    const scoreDelta = this.scoreRules.calculate(shape.cells.length, clearedLineCount);
    session.score += scoreDelta;

    const result: MoveResult = {
      slotId: request.slotId,
      shape,
      placedCells,
      completedLines,
      clearedCells,
      boardBeforeClear,
      boardAfterClear,
      scoreDelta,
      score: session.score,
    };
    if (session.slots.areAllEmpty()) {
      session.slots.replace(session.deck.draw(BlockPuzzleSlots.Count));
    }

    this.sceneContext.engine.events.emit({
      type: BlockPuzzleEvents.PlacementCompleted,
      data: result,
    });
    if (clearedLineCount > 0) {
      this.sceneContext.engine.events.emit({
        type: BlockPuzzleEvents.LinesCleared,
        data: {
          cells: clearedCells,
          rows: completedLines.rows,
          columns: completedLines.columns,
          color: shape.color,
          lineCount: clearedLineCount,
        },
      });
    }
    this.emitBoardChanged();
    this.emitBlocksChanged();
    this.emitScoreChanged(scoreDelta);
  }

  hasAvailableMove(): boolean {
    const session = this.getSession();
    return session.slots.hasPlaceableShape((shape) =>
      session.board.canPlaceAnywhere(shape),
    );
  }

  applyGameOver(): void {
    const session = this.getSession();
    if (session.ended) return;

    session.ended = true;
    const isNewBest = session.score > session.bestScore;
    const saved = this.progress.setBestScore(session.score);
    session.bestScore = saved.bestScore;
    this.sceneContext.engine.events.emit({
      type: BlockPuzzleEvents.ResultReady,
      data: {
        score: session.score,
        bestScore: session.bestScore,
        isNewBest,
      },
    });
  }

  emitMoveAvailability(): void {
    this.sceneContext.engine.events.emit({
      type: this.hasAvailableMove()
        ? BlockPuzzleEvents.MovesAvailable
        : BlockPuzzleEvents.GameOver,
      data: {},
    });
  }

  protected override onExit(): void {
    this.session = undefined;
  }

  private emitBoardChanged(): void {
    this.sceneContext.engine.events.emit({
      type: BlockPuzzleEvents.BoardChanged,
    });
  }

  private emitBlocksChanged(): void {
    this.sceneContext.engine.events.emit({
      type: BlockPuzzleEvents.BlocksChanged,
    });
  }

  private emitScoreChanged(delta: number): void {
    this.sceneContext.engine.events.emit({
      type: BlockPuzzleEvents.ScoreChanged,
      data: { score: this.getSession().score, delta },
    });
  }

  private getSession(): BlockPuzzleSession {
    const session = this.session;
    if (session === undefined) {
      throw new Error('BlockPuzzleGameplayService: session is not started');
    }
    return session;
  }
}
