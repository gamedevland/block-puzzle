import { ConfigEntry } from '@gamedevland/engine/configs';
import { SchemaDecoder } from '@gamedevland/engine/validation';

import type { InferDecoded } from '@gamedevland/engine/validation';

export class BlockPuzzleConfigEntries {
  private static readonly CellDecoder = SchemaDecoder.object({
    row: SchemaDecoder.number({ integer: true, min: 0 }),
    column: SchemaDecoder.number({ integer: true, min: 0 }),
  });

  private static readonly ShapeDecoder = SchemaDecoder.object({
    id: SchemaDecoder.string({ nonEmpty: true }),
    color: SchemaDecoder.number({ integer: true, min: 0, max: 0xffffff }),
    cells: SchemaDecoder.readonlyArray(BlockPuzzleConfigEntries.CellDecoder),
  });

  static readonly Board = new ConfigEntry(
    'json/configs/scenes/game/board.json',
    SchemaDecoder.object({
      width: SchemaDecoder.number({ integer: true, min: 1 }),
      height: SchemaDecoder.number({ integer: true, min: 1 }),
    }),
  );

  static readonly Shapes = new ConfigEntry(
    'json/configs/scenes/game/shapes.json',
    SchemaDecoder.object({
      shapes: SchemaDecoder.readonlyArray(BlockPuzzleConfigEntries.ShapeDecoder),
    }),
  );

  static readonly Scoring = new ConfigEntry(
    'json/configs/scenes/game/scoring.json',
    SchemaDecoder.object({
      pointsPerPlacedCell: SchemaDecoder.number({ integer: true, min: 0 }),
      pointsPerClearedLine: SchemaDecoder.number({ integer: true, min: 0 }),
      multiLineBonus: SchemaDecoder.number({ integer: true, min: 0 }),
    }),
  );

  static readonly Geometry = new ConfigEntry(
    'json/configs/scenes/game/geometry.json',
    SchemaDecoder.object({
      board: SchemaDecoder.object({
        cellSize: SchemaDecoder.number({ min: 1 }),
        gap: SchemaDecoder.number({ min: 0 }),
      }),
      slots: SchemaDecoder.object({
        cellSize: SchemaDecoder.number({ min: 1 }),
        gap: SchemaDecoder.number({ min: 0 }),
        topGap: SchemaDecoder.number({ min: 0 }),
        height: SchemaDecoder.number({ min: 1 }),
        hitPaddingX: SchemaDecoder.number({ min: 0 }),
        hitPaddingY: SchemaDecoder.number({ min: 0 }),
      }),
      composition: SchemaDecoder.object({
        topReserve: SchemaDecoder.number({ min: 0 }),
      }),
    }),
  );
}

export type BlockPuzzleBoardConfig = InferDecoded<
  typeof BlockPuzzleConfigEntries.Board.decoder
>;
export type BlockPuzzleShapesConfig = InferDecoded<
  typeof BlockPuzzleConfigEntries.Shapes.decoder
>;
export type BlockPuzzleScoringConfig = InferDecoded<
  typeof BlockPuzzleConfigEntries.Scoring.decoder
>;
export type BlockPuzzleGeometryConfig = InferDecoded<
  typeof BlockPuzzleConfigEntries.Geometry.decoder
>;
