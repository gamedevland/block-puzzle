import { BlockPuzzleShape } from './BlockPuzzleShape';

import type { ShapeDefinition } from './BlockPuzzleTypes';

export class BlockPuzzleShapeDeck {
  private readonly shapes: readonly BlockPuzzleShape[];
  private cursor = 0;

  constructor(definitions: readonly ShapeDefinition[]) {
    if (definitions.length === 0) {
      throw new Error('BlockPuzzleShapeDeck: at least one shape is required');
    }
    this.shapes = definitions.map((definition) => new BlockPuzzleShape(definition));
  }

  draw(count: number): readonly BlockPuzzleShape[] {
    if (!Number.isInteger(count) || count <= 0) {
      throw new Error('BlockPuzzleShapeDeck: draw count must be a positive integer');
    }

    const result: BlockPuzzleShape[] = [];
    for (let index = 0; index < count; index += 1) {
      const shape = this.shapes[this.cursor];
      if (shape === undefined) {
        throw new Error('BlockPuzzleShapeDeck: cursor points outside the shape pool');
      }
      result.push(shape);
      this.cursor = (this.cursor + 1) % this.shapes.length;
    }
    return result;
  }
}
