import type { CellCoordinate, ShapeDefinition } from './BlockPuzzleTypes';

export class BlockPuzzleShape implements ShapeDefinition {
  readonly id: string;
  readonly color: number;
  readonly cells: readonly CellCoordinate[];

  constructor(definition: ShapeDefinition) {
    if (definition.id.trim().length === 0) {
      throw new Error('BlockPuzzleShape: id must be non-empty');
    }
    if (definition.cells.length === 0) {
      throw new Error(`BlockPuzzleShape '${definition.id}': cells must be non-empty`);
    }

    const keys = new Set<string>();
    let minRow = Number.POSITIVE_INFINITY;
    let minColumn = Number.POSITIVE_INFINITY;
    const cells = definition.cells.map((cell) => {
      if (!Number.isInteger(cell.row) || !Number.isInteger(cell.column)) {
        throw new Error(
          `BlockPuzzleShape '${definition.id}': cell coordinates must be integers`,
        );
      }
      if (cell.row < 0 || cell.column < 0) {
        throw new Error(
          `BlockPuzzleShape '${definition.id}': cell coordinates must be non-negative`,
        );
      }
      const key = `${cell.row}:${cell.column}`;
      if (keys.has(key)) {
        throw new Error(`BlockPuzzleShape '${definition.id}': duplicate cell '${key}'`);
      }
      keys.add(key);
      minRow = Math.min(minRow, cell.row);
      minColumn = Math.min(minColumn, cell.column);
      return Object.freeze({ row: cell.row, column: cell.column });
    });
    if (minRow !== 0 || minColumn !== 0) {
      throw new Error(
        `BlockPuzzleShape '${definition.id}': cells must be normalized to row 0 and column 0`,
      );
    }

    this.id = definition.id;
    this.color = definition.color;
    this.cells = Object.freeze(cells);
  }
}
