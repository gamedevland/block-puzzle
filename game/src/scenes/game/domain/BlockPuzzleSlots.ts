import type { ShapeDefinition, ShapeSlot } from './BlockPuzzleTypes';

export class BlockPuzzleSlots {
  static readonly Count = 3;

  private slots: ShapeSlot[] = [];

  replace(shapes: readonly ShapeDefinition[]): void {
    if (shapes.length !== BlockPuzzleSlots.Count) {
      throw new Error(`BlockPuzzleSlots: exactly ${BlockPuzzleSlots.Count} shapes are required`);
    }
    this.slots = shapes.map((shape, id) => ({ id, shape }));
  }

  get(slotId: number): ShapeDefinition | null {
    const slot = this.slots[slotId];
    if (slot === undefined) {
      throw new Error(`BlockPuzzleSlots: unknown slot '${slotId}'`);
    }
    return slot.shape;
  }

  use(slotId: number): void {
    const shape = this.get(slotId);
    if (shape === null) {
      throw new Error(`BlockPuzzleSlots: slot '${slotId}' is already empty`);
    }
    this.slots[slotId] = { id: slotId, shape: null };
  }

  areAllEmpty(): boolean {
    return (
      this.slots.length === BlockPuzzleSlots.Count
      && this.slots.every((slot) => slot.shape === null)
    );
  }

  hasPlaceableShape(
    canPlace: (shape: ShapeDefinition) => boolean,
  ): boolean {
    return this.slots.some(
      (slot) => slot.shape !== null && canPlace(slot.shape),
    );
  }

  snapshot(): readonly ShapeSlot[] {
    return this.slots.map((slot) => ({ id: slot.id, shape: slot.shape }));
  }
}
