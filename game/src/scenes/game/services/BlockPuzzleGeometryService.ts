import { BlockPuzzleSlots } from '../domain/BlockPuzzleSlots';

import type {
  BlockPuzzleBoardConfig,
  BlockPuzzleGeometryConfig,
} from '../configs/schemas';
import type { CellCoordinate } from '../domain/BlockPuzzleTypes';

export class BlockPuzzleGeometryService {
  constructor(
    private readonly boardConfig: BlockPuzzleBoardConfig,
    private readonly geometryConfig: BlockPuzzleGeometryConfig,
  ) {
    if (this.slotHitWidth <= 0 || this.slotHitHeight <= 0) {
      throw new Error(
        'BlockPuzzleGeometryService: slot hit area must have positive dimensions',
      );
    }
  }

  get boardCellSize(): number {
    return this.geometryConfig.board.cellSize;
  }

  get boardGap(): number {
    return this.geometryConfig.board.gap;
  }

  get boardStep(): number {
    return this.boardCellSize + this.boardGap;
  }

  get boardWidth(): number {
    return this.resolveGridSize(
      this.boardConfig.width,
      this.boardCellSize,
      this.boardGap,
    );
  }

  get boardHeight(): number {
    return this.resolveGridSize(
      this.boardConfig.height,
      this.boardCellSize,
      this.boardGap,
    );
  }

  get slotCellSize(): number {
    return this.geometryConfig.slots.cellSize;
  }

  get slotGap(): number {
    return this.geometryConfig.slots.gap;
  }

  get slotsY(): number {
    return this.boardHeight + this.geometryConfig.slots.topGap;
  }

  get slotsHeight(): number {
    return this.geometryConfig.slots.height;
  }

  get compositionWidth(): number {
    return this.boardWidth;
  }

  get compositionHeight(): number {
    return (
      this.geometryConfig.composition.topReserve
      + this.boardHeight
      + this.geometryConfig.slots.topGap
      + this.slotsHeight
    );
  }

  get slotWidth(): number {
    return this.compositionWidth / BlockPuzzleSlots.Count;
  }

  get slotHitWidth(): number {
    return this.slotWidth - this.geometryConfig.slots.hitPaddingX * 2;
  }

  get slotHitHeight(): number {
    return this.slotsHeight - this.geometryConfig.slots.hitPaddingY * 2;
  }

  getSlotCenter(slotId: number): {
    readonly x: number;
    readonly y: number;
  } {
    return {
      x: this.slotWidth * (slotId + 0.5),
      y: this.slotsHeight / 2,
    };
  }

  getBoardCellPosition(cell: CellCoordinate): {
    readonly x: number;
    readonly y: number;
  } {
    return {
      x: cell.column * this.boardStep + this.boardCellSize / 2,
      y: cell.row * this.boardStep + this.boardCellSize / 2,
    };
  }

  private resolveGridSize(
    count: number,
    cellSize: number,
    gap: number,
  ): number {
    return count * cellSize + (count - 1) * gap;
  }
}
