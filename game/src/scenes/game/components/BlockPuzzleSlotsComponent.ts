import { BaseTypedComponent } from '@gamedevland/engine/layouts';
import { SchemaDecoder } from '@gamedevland/engine/validation';

import { BlockPuzzleServices } from '../BlockPuzzleServices';
import { BlockPuzzleEventSchemas } from '../configs/event.schemas';
import { BlockPuzzleEvents } from '../configs/events';
import { BlockPuzzleSlots } from '../domain/BlockPuzzleSlots';

import { BlockPuzzleShapeView } from './BlockPuzzleShapeView';

import type { BlockPuzzleGeometryService } from '../services/BlockPuzzleGeometryService';
import type { AppEvent } from '@gamedevland/engine/events';
import type { InputEventBase } from '@gamedevland/engine/input';
import type { Container } from '@gamedevland/engine/layouts';
import type { InferDecoded } from '@gamedevland/engine/validation';

const ConfigDecoder = SchemaDecoder.object({
  tilePrefab: SchemaDecoder.string({ nonEmpty: true }),
  spawnDuration: SchemaDecoder.number({ min: 0 }),
  spawnStagger: SchemaDecoder.number({ min: 0 }),
  draggedAlpha: SchemaDecoder.number({ min: 0, max: 1 }),
  draggedScale: SchemaDecoder.number({ min: 0, max: 1 }),
  restoreDuration: SchemaDecoder.number({ min: 0 }),
});

type BlockPuzzleSlotsConfig = InferDecoded<typeof ConfigDecoder>;

export class BlockPuzzleSlotsComponent extends BaseTypedComponent<
  BlockPuzzleSlotsConfig,
  Container
> {
  protected override readonly configDecoder = ConfigDecoder;

  private readonly shapeViews = new Map<number, BlockPuzzleShapeView>();
  private readonly renderedShapeIds = new Map<number, string | null>();
  private readonly visibleCellsBySlot = new Map<number, readonly Container[]>();
  private readonly eventOffs: Array<() => void> = [];
  private readonly inputOffs: Array<() => void> = [];
  private activeDragSlot: number | undefined;
  private visualsReady = false;

  protected override onReady(): void {
    this.trackTask(this.initializeShapeViews());
  }

  protected override onEnable(): void {
    this.bindEvents();
    if (this.visualsReady) {
      this.bindInput();
      this.renderSlots();
    }
  }

  protected override onDisable(): void {
    this.teardownEvents();
    this.killOwnedTweens();
    this.settleVisibleCells();
    this.activeDragSlot = undefined;
  }

  override onDetach(): void {
    this.teardownEvents();
    this.shapeViews.clear();
    this.renderedShapeIds.clear();
    this.visibleCellsBySlot.clear();
    this.activeDragSlot = undefined;
    this.visualsReady = false;
    super.onDetach();
  }

  private bindEvents(): void {
    for (const off of this.eventOffs) off();
    this.eventOffs.length = 0;
    this.eventOffs.push(
      this.node.events.on(BlockPuzzleEvents.BlocksChanged, () => {
        this.renderSlots();
      }),
      this.node.events.on(BlockPuzzleEvents.DragStarted, (event) => {
        this.dimDraggedSlot(event);
      }),
      this.node.events.on(BlockPuzzleEvents.DragCancelled, (event) => {
        this.restoreDraggedSlot(event);
      }),
      this.node.events.on(BlockPuzzleEvents.PlacementCompleted, () => {
        this.activeDragSlot = undefined;
      }),
    );
  }

  private bindInput(): void {
    for (const off of this.inputOffs) off();
    this.inputOffs.length = 0;

    for (let slotId = 0; slotId < BlockPuzzleSlots.Count; slotId += 1) {
      const slot = this.node.getChildContainer(`slot-${slotId}`);
      this.inputOffs.push(
        slot.input.on('pointerdown', (event) => {
          this.handleSlotPressed(slotId, event);
        }),
      );
    }
  }

  private teardownEvents(): void {
    for (const off of this.eventOffs) off();
    for (const off of this.inputOffs) off();
    this.eventOffs.length = 0;
    this.inputOffs.length = 0;
  }

  private async initializeShapeViews(): Promise<void> {
    const scopeVersion = this.getComponentScopeVersion();
    const cellCount = this.gameplay.getMaxShapeCellCount();

    for (let slotId = 0; slotId < BlockPuzzleSlots.Count; slotId += 1) {
      const slot = this.node.getChildContainer(`slot-${slotId}`);
      const cells: Container[] = [];

      for (let index = 0; index < cellCount; index += 1) {
        const spawned = await this.awaitComponentScopeResource(
          slot.spawnPrefab<Container>({
            prefabId: this.config.tilePrefab,
            localId: `cell-${index}`,
            overrides: { visible: false },
          }),
          (resource) => resource.dispose(),
          scopeVersion,
        );
        if (spawned === undefined) return;
        cells.push(spawned.node);
      }

      this.shapeViews.set(
        slotId,
        new BlockPuzzleShapeView(cells),
      );
    }

    this.visualsReady = true;
    if (this.enabled) {
      this.bindInput();
    }
    this.renderSlots();
  }

  private renderSlots(): void {
    if (!this.visualsReady) return;

    for (const slot of this.gameplay.getSlotsSnapshot()) {
      const shapeView = this.requireShapeView(slot.id);

      if (slot.shape === null) {
        shapeView.hide();
        this.visibleCellsBySlot.delete(slot.id);
        this.renderedShapeIds.set(slot.id, null);
        continue;
      }

      const visibleCells = shapeView.render(
        slot.shape,
        this.geometry.slotCellSize,
        this.geometry.slotGap,
      );
      this.visibleCellsBySlot.set(slot.id, visibleCells);
      const shouldAnimate =
        this.renderedShapeIds.get(slot.id) !== slot.shape.id;
      this.renderedShapeIds.set(slot.id, slot.shape.id);
      if (!shouldAnimate) continue;

      const scale = shapeView.resolveScale(this.geometry.slotCellSize);
      for (const cell of visibleCells) {
        this.animateCellSpawn(cell, scale, slot.id * this.config.spawnStagger);
      }
    }
  }

  private animateCellSpawn(
    cell: Container,
    targetScale: number,
    delay: number,
  ): void {
    this.node.engine.tweens.kill(cell);
    cell.setAlpha(0).setScale(targetScale * 0.65);

    this.ownTween(
      cell.tweens.fadeIn(this.config.spawnDuration, {
        delay,
        ease: 'power1.out',
      }),
    );
    this.ownTween(
      cell.tweens.scaleTo(targetScale, this.config.spawnDuration, {
        delay,
        ease: 'back.out(2)',
      }),
    );
  }

  private dimDraggedSlot(event: AppEvent): void {
    const { slotId } = this.decodeDragSlot(event);
    const cells = this.visibleCellsBySlot.get(slotId);
    if (cells === undefined) return;

    this.activeDragSlot = slotId;
    const targetScale =
      this.requireShapeView(slotId).resolveScale(this.geometry.slotCellSize)
      * this.config.draggedScale;

    for (const cell of cells) {
      this.node.engine.tweens.kill(cell);
      this.ownTween(
        cell.tweens.alphaTo(this.config.draggedAlpha, this.config.restoreDuration, {
          ease: 'power1.out',
        }),
      );
      this.ownTween(
        cell.tweens.scaleTo(targetScale, this.config.restoreDuration, {
          ease: 'power1.out',
        }),
      );
    }
  }

  private restoreDraggedSlot(event: AppEvent): void {
    const { slotId } = this.decodeDragSlot(event);
    if (this.activeDragSlot !== slotId) return;

    this.activeDragSlot = undefined;
    const cells = this.visibleCellsBySlot.get(slotId);
    if (cells === undefined) return;
    const targetScale = this.requireShapeView(slotId).resolveScale(
      this.geometry.slotCellSize,
    );

    for (const cell of cells) {
      this.node.engine.tweens.kill(cell);
      cell.setAlpha(1).setScale(targetScale);
    }
  }

  private decodeDragSlot(event: AppEvent): { readonly slotId: number } {
    return SchemaDecoder.decode(
      event.payload,
      BlockPuzzleEventSchemas.DragSlot,
      event.type,
    );
  }

  private requireShapeView(slotId: number): BlockPuzzleShapeView {
    const shapeView = this.shapeViews.get(slotId);
    if (shapeView === undefined) {
      throw new Error(`BlockPuzzleSlotsComponent: missing slot '${slotId}'`);
    }
    return shapeView;
  }

  private settleVisibleCells(): void {
    for (const [slotId, cells] of this.visibleCellsBySlot) {
      const scale = this.requireShapeView(slotId).resolveScale(
        this.geometry.slotCellSize,
      );
      for (const cell of cells) {
        this.node.engine.tweens.kill(cell);
        cell.setAlpha(1).setScale(scale);
      }
    }
  }

  private handleSlotPressed(slotId: number, event: InputEventBase): void {
    if (this.gameplay.getShape(slotId) === null) return;

    this.node.events.emit({
      type: BlockPuzzleEvents.SlotPressed,
      data: {
        pointerId: event.pointerId,
        slotId,
      },
    });
  }

  private get gameplay() {
    return this.node.engine
      .getRequiredActiveSceneDi()
      .get(BlockPuzzleServices.Gameplay);
  }

  private get geometry(): BlockPuzzleGeometryService {
    return this.node.engine
      .getRequiredActiveSceneDi()
      .get(BlockPuzzleServices.Geometry);
  }
}
