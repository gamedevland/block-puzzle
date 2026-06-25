import type {
  BoardSnapshot,
  CellCoordinate,
  CompletedLines,
  PlacedTile,
  PlacementPreview,
  ShapeDefinition,
} from './BlockPuzzleTypes';

export class BlockPuzzleBoard {
  private readonly cells: Array<Array<PlacedTile | null>>;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
      throw new Error('BlockPuzzleBoard: dimensions must be positive integers');
    }
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null),
    );
  }

  canPlace(shape: ShapeDefinition, anchor: CellCoordinate): boolean {
    return shape.cells.every((cell) => {
      const target = this.resolveTarget(anchor, cell);
      return this.isInside(target) && this.readCell(target) === null;
    });
  }

  canPlaceAnywhere(shape: ShapeDefinition): boolean {
    for (let row = 0; row < this.height; row += 1) {
      for (let column = 0; column < this.width; column += 1) {
        if (this.canPlace(shape, { row, column })) {
          return true;
        }
      }
    }
    return false;
  }

  preview(shape: ShapeDefinition, anchor: CellCoordinate): PlacementPreview {
    if (!this.canPlace(shape, anchor)) {
      return {
        valid: false,
        color: shape.color,
        cells: [],
        completedLines: { rows: [], columns: [] },
      };
    }

    const cells = shape.cells.map((cell) => this.resolveTarget(anchor, cell));
    return {
      valid: true,
      color: shape.color,
      cells,
      completedLines: this.findCompletedLines(cells),
    };
  }

  place(shape: ShapeDefinition, anchor: CellCoordinate): readonly CellCoordinate[] {
    if (!this.canPlace(shape, anchor)) {
      throw new Error(`BlockPuzzleBoard: shape '${shape.id}' cannot be placed at target anchor`);
    }

    return shape.cells.map((cell) => {
      const target = this.resolveTarget(anchor, cell);
      this.writeCell(target, { shapeId: shape.id, color: shape.color });
      return target;
    });
  }

  findCompletedLines(additionalCells: readonly CellCoordinate[] = []): CompletedLines {
    const additionalKeys = new Set(additionalCells.map((cell) => this.cellKey(cell)));
    const rows: number[] = [];
    const columns: number[] = [];

    for (let row = 0; row < this.height; row += 1) {
      let complete = true;
      for (let column = 0; column < this.width; column += 1) {
        const cell = { row, column };
        if (this.readCell(cell) === null && !additionalKeys.has(this.cellKey(cell))) {
          complete = false;
          break;
        }
      }
      if (complete) rows.push(row);
    }

    for (let column = 0; column < this.width; column += 1) {
      let complete = true;
      for (let row = 0; row < this.height; row += 1) {
        const cell = { row, column };
        if (this.readCell(cell) === null && !additionalKeys.has(this.cellKey(cell))) {
          complete = false;
          break;
        }
      }
      if (complete) columns.push(column);
    }

    return { rows, columns };
  }

  collectCells(lines: CompletedLines): readonly CellCoordinate[] {
    const cellsByKey = new Map<string, CellCoordinate>();

    for (const row of lines.rows) {
      for (let column = 0; column < this.width; column += 1) {
        const cell = { row, column };
        cellsByKey.set(this.cellKey(cell), cell);
      }
    }
    for (const column of lines.columns) {
      for (let row = 0; row < this.height; row += 1) {
        const cell = { row, column };
        cellsByKey.set(this.cellKey(cell), cell);
      }
    }

    return [...cellsByKey.values()];
  }

  clear(cells: readonly CellCoordinate[]): void {
    for (const cell of cells) {
      if (!this.isInside(cell)) {
        throw new Error('BlockPuzzleBoard: cannot clear a cell outside the board');
      }
      this.writeCell(cell, null);
    }
  }

  snapshot(): BoardSnapshot {
    return this.cells.map((row) =>
      row.map((cell) => (cell === null ? null : Object.freeze({ ...cell }))),
    );
  }

  private resolveTarget(anchor: CellCoordinate, relative: CellCoordinate): CellCoordinate {
    return {
      row: anchor.row + relative.row,
      column: anchor.column + relative.column,
    };
  }

  private isInside(cell: CellCoordinate): boolean {
    return (
      cell.row >= 0 &&
      cell.row < this.height &&
      cell.column >= 0 &&
      cell.column < this.width
    );
  }

  private readCell(cell: CellCoordinate): PlacedTile | null {
    const row = this.cells[cell.row];
    if (row === undefined) {
      throw new Error(`BlockPuzzleBoard: row '${cell.row}' is outside the board`);
    }
    const value = row[cell.column];
    if (value === undefined) {
      throw new Error(`BlockPuzzleBoard: column '${cell.column}' is outside the board`);
    }
    return value;
  }

  private writeCell(cell: CellCoordinate, value: PlacedTile | null): void {
    const row = this.cells[cell.row];
    if (row === undefined || cell.column < 0 || cell.column >= this.width) {
      throw new Error('BlockPuzzleBoard: target cell is outside the board');
    }
    row[cell.column] = value;
  }

  private cellKey(cell: CellCoordinate): string {
    return `${cell.row}:${cell.column}`;
  }
}
