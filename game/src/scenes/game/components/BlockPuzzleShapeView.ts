import type { ShapeDefinition } from '../domain/BlockPuzzleTypes';
import type { Container } from '@gamedevland/engine/layouts';

export class BlockPuzzleShapeView {
  private readonly logicalCellSize: number;

  constructor(private readonly cells: readonly Container[]) {
    const firstCell = cells[0];
    if (firstCell === undefined) {
      throw new Error('BlockPuzzleShapeView: at least one cell is required');
    }
    const bounds = firstCell.getLocalBounds();
    if (bounds.width <= 0 || bounds.height <= 0) {
      throw new Error(
        'BlockPuzzleShapeView: prefab must have positive local bounds',
      );
    }
    this.logicalCellSize = Math.max(bounds.width, bounds.height);
  }

  render(
    shape: ShapeDefinition,
    cellSize: number,
    gap: number,
  ): readonly Container[] {
    if (shape.cells.length > this.cells.length) {
      throw new Error(`BlockPuzzleShapeView: shape '${shape.id}' exceeds the cell pool`);
    }

    const size = this.resolveSize(shape, cellSize, gap);
    const step = cellSize + gap;
    const offsetX = -size.width / 2 + cellSize / 2;
    const offsetY = -size.height / 2 + cellSize / 2;
    const scale = this.resolveScale(cellSize);
    const visibleCells: Container[] = [];

    for (let index = 0; index < this.cells.length; index += 1) {
      const cell = this.cells[index];
      if (cell === undefined) continue;

      const shapeCell = shape.cells[index];
      if (shapeCell === undefined) {
        cell.setVisible(false);
        continue;
      }

      cell
        .setPosition(
          offsetX + shapeCell.column * step,
          offsetY + shapeCell.row * step,
        )
        .setTint(shape.color)
        .setAlpha(1)
        .setScale(scale)
        .setVisible(true);
      visibleCells.push(cell);
    }

    return visibleCells;
  }

  hide(): void {
    for (const cell of this.cells) {
      cell.setVisible(false);
    }
  }

  resolveScale(cellSize: number): number {
    return cellSize / this.logicalCellSize;
  }

  resolveCellPosition(
    shape: ShapeDefinition,
    index: number,
    cellSize: number,
    gap: number,
  ): { readonly x: number; readonly y: number } {
    const shapeCell = shape.cells[index];
    if (shapeCell === undefined) {
      throw new Error(
        `BlockPuzzleShapeView: shape '${shape.id}' has no cell at index '${index}'`,
      );
    }
    const size = this.resolveSize(shape, cellSize, gap);
    const step = cellSize + gap;
    return {
      x: -size.width / 2 + cellSize / 2 + shapeCell.column * step,
      y: -size.height / 2 + cellSize / 2 + shapeCell.row * step,
    };
  }

  resolveSize(
    shape: ShapeDefinition,
    cellSize: number,
    gap: number,
  ): { readonly width: number; readonly height: number } {
    const bounds = this.resolveBounds(shape);
    return {
      width: bounds.width * cellSize + (bounds.width - 1) * gap,
      height: bounds.height * cellSize + (bounds.height - 1) * gap,
    };
  }

  private resolveBounds(
    shape: ShapeDefinition,
  ): { readonly width: number; readonly height: number } {
    let maxRow = 0;
    let maxColumn = 0;

    for (const cell of shape.cells) {
      maxRow = Math.max(maxRow, cell.row);
      maxColumn = Math.max(maxColumn, cell.column);
    }

    return {
      width: maxColumn + 1,
      height: maxRow + 1,
    };
  }
}
