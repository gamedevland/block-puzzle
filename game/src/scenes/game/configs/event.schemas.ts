import { SchemaDecoder } from '@gamedevland/engine/validation';

import { BlockPuzzleSlots } from '../domain/BlockPuzzleSlots';

import type { BoardCell } from '../domain/BlockPuzzleTypes';
import type { Decoder, InferDecoded } from '@gamedevland/engine/validation';

export class BlockPuzzleEventSchemas {
  static readonly Cell = SchemaDecoder.object({
    row: SchemaDecoder.number({ integer: true }),
    column: SchemaDecoder.number({ integer: true }),
  });

  private static readonly Shape = SchemaDecoder.object({
    id: SchemaDecoder.string({ nonEmpty: true }),
    color: SchemaDecoder.number({ integer: true, min: 0, max: 0xffffff }),
    cells: SchemaDecoder.readonlyArray(BlockPuzzleEventSchemas.Cell),
  });

  private static readonly PlacedTile = SchemaDecoder.object({
    shapeId: SchemaDecoder.string({ nonEmpty: true }),
    color: SchemaDecoder.number({ integer: true, min: 0, max: 0xffffff }),
  });

  private static readonly BoardCellDecoder: Decoder<BoardCell> = (
    input,
    context,
  ) => {
    if (input === null) return null;
    return BlockPuzzleEventSchemas.PlacedTile(input, context);
  };

  private static readonly Board = SchemaDecoder.readonlyArray(
    SchemaDecoder.readonlyArray(BlockPuzzleEventSchemas.BoardCellDecoder),
  );

  private static readonly CompletedLines = SchemaDecoder.object({
    rows: SchemaDecoder.readonlyArray(
      SchemaDecoder.number({ integer: true, min: 0 }),
    ),
    columns: SchemaDecoder.readonlyArray(
      SchemaDecoder.number({ integer: true, min: 0 }),
    ),
  });

  static readonly SlotPressed = SchemaDecoder.object({
    pointerId: SchemaDecoder.number({ integer: true }),
    slotId: SchemaDecoder.number({
      integer: true,
      min: 0,
      max: BlockPuzzleSlots.Count - 1,
    }),
  });

  static readonly DragSlot = SchemaDecoder.object({
    slotId: SchemaDecoder.number({
      integer: true,
      min: 0,
      max: BlockPuzzleSlots.Count - 1,
    }),
  });

  static readonly PlacementPreview = SchemaDecoder.object({
    valid: SchemaDecoder.boolean(),
    color: SchemaDecoder.number({ integer: true, min: 0, max: 0xffffff }),
    cells: SchemaDecoder.readonlyArray(BlockPuzzleEventSchemas.Cell),
    completedLines: BlockPuzzleEventSchemas.CompletedLines,
  });

  static readonly PlacementRequest = SchemaDecoder.object({
    slotId: SchemaDecoder.number({
      integer: true,
      min: 0,
      max: BlockPuzzleSlots.Count - 1,
    }),
    anchor: BlockPuzzleEventSchemas.Cell,
  });

  static readonly PlacementCompleted = SchemaDecoder.object({
    slotId: SchemaDecoder.number({
      integer: true,
      min: 0,
      max: BlockPuzzleSlots.Count - 1,
    }),
    shape: BlockPuzzleEventSchemas.Shape,
    placedCells: SchemaDecoder.readonlyArray(BlockPuzzleEventSchemas.Cell),
    completedLines: BlockPuzzleEventSchemas.CompletedLines,
    clearedCells: SchemaDecoder.readonlyArray(BlockPuzzleEventSchemas.Cell),
    boardBeforeClear: BlockPuzzleEventSchemas.Board,
    boardAfterClear: BlockPuzzleEventSchemas.Board,
    scoreDelta: SchemaDecoder.number({ integer: true, min: 0 }),
    score: SchemaDecoder.number({ integer: true, min: 0 }),
  });

  static readonly LinesCleared = SchemaDecoder.object({
    cells: SchemaDecoder.readonlyArray(BlockPuzzleEventSchemas.Cell),
    rows: SchemaDecoder.readonlyArray(SchemaDecoder.number({ integer: true, min: 0 })),
    columns: SchemaDecoder.readonlyArray(SchemaDecoder.number({ integer: true, min: 0 })),
    color: SchemaDecoder.number({ integer: true, min: 0, max: 0xffffff }),
    lineCount: SchemaDecoder.number({ integer: true, min: 1 }),
  });

  static readonly ScoreChanged = SchemaDecoder.object({
    score: SchemaDecoder.number({ integer: true, min: 0 }),
    delta: SchemaDecoder.number({ integer: true, min: 0 }),
  });

  static readonly ResultReady = SchemaDecoder.object({
    score: SchemaDecoder.number({ integer: true, min: 0 }),
    bestScore: SchemaDecoder.number({ integer: true, min: 0 }),
    isNewBest: SchemaDecoder.boolean(),
  });
}

export type BlockPuzzlePlacementCompletedPayload = InferDecoded<
  typeof BlockPuzzleEventSchemas.PlacementCompleted
>;
