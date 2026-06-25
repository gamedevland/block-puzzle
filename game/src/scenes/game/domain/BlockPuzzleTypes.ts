export interface CellCoordinate {
  readonly row: number;
  readonly column: number;
}

export interface ShapeDefinition {
  readonly id: string;
  readonly color: number;
  readonly cells: readonly CellCoordinate[];
}

export interface PlacedTile {
  readonly shapeId: string;
  readonly color: number;
}

export type BoardCell = PlacedTile | null;
export type BoardSnapshot = readonly (readonly BoardCell[])[];

export interface CompletedLines {
  readonly rows: readonly number[];
  readonly columns: readonly number[];
}

export interface PlacementPreview {
  readonly valid: boolean;
  readonly color: number;
  readonly cells: readonly CellCoordinate[];
  readonly completedLines: CompletedLines;
}

export interface ShapeSlot {
  readonly id: number;
  readonly shape: ShapeDefinition | null;
}

export interface PlacementRequest {
  readonly slotId: number;
  readonly anchor: CellCoordinate;
}

export interface MoveResult {
  readonly slotId: number;
  readonly shape: ShapeDefinition;
  readonly placedCells: readonly CellCoordinate[];
  readonly completedLines: CompletedLines;
  readonly clearedCells: readonly CellCoordinate[];
  readonly boardBeforeClear: BoardSnapshot;
  readonly boardAfterClear: BoardSnapshot;
  readonly scoreDelta: number;
  readonly score: number;
}
