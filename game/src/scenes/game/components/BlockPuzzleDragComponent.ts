import { BaseTypedComponent } from '@gamedevland/engine/layouts';
import { SchemaDecoder } from '@gamedevland/engine/validation';

import { BlockPuzzleServices } from '../BlockPuzzleServices';
import { BlockPuzzleEventSchemas } from '../configs/event.schemas';
import { BlockPuzzleEvents } from '../configs/events';

import { BlockPuzzleShapeView } from './BlockPuzzleShapeView';

import type {
  CellCoordinate,
  PlacementPreview,
  ShapeDefinition,
} from '../domain/BlockPuzzleTypes';
import type { BlockPuzzleGeometryService } from '../services/BlockPuzzleGeometryService';
import type { AppEvent } from '@gamedevland/engine/events';
import type { InputEventBase } from '@gamedevland/engine/input';
import type {
  Container,
  ResponsiveLayoutComponent,
} from '@gamedevland/engine/layouts';
import type { InferDecoded } from '@gamedevland/engine/validation';

interface DragSelection {
  readonly pointerId: number;
  readonly slotId: number;
}

type DragPhase = 'dragging' | 'snapping' | 'returning';

interface DragSession extends DragSelection {
  readonly shape: ShapeDefinition;
  preview: PlacementPreview;
  phase: DragPhase;
}

const ConfigDecoder = SchemaDecoder.object({
  responsiveRootPath: SchemaDecoder.string({ nonEmpty: true }),
  boardPath: SchemaDecoder.string({ nonEmpty: true }),
  slotsPath: SchemaDecoder.string({ nonEmpty: true }),
  dragLayerPath: SchemaDecoder.string({ nonEmpty: true }),
  tilePrefab: SchemaDecoder.string({ nonEmpty: true }),
  snapDuration: SchemaDecoder.number({ min: 0 }),
  returnDuration: SchemaDecoder.number({ min: 0 }),
});

type BlockPuzzleDragConfig = InferDecoded<typeof ConfigDecoder>;

export class BlockPuzzleDragComponent extends BaseTypedComponent<
  BlockPuzzleDragConfig,
  Container
> {
  protected override readonly configDecoder = ConfigDecoder;

  private readonly eventOffs: Array<() => void> = [];
  private readonly inputOffs: Array<() => void> = [];
  private shapeView: BlockPuzzleShapeView | undefined;
  private selection: DragSelection | undefined;
  private drag: DragSession | undefined;

  protected override onReady(): void {
    this.trackTask(this.initializeShapeView());
  }

  protected override onEnable(): void {
    this.bindEvents();
  }

  protected override onDisable(): void {
    this.teardownEvents();
    this.killOwnedTweens();
    this.clearDrag();
  }

  override onDetach(): void {
    this.teardownEvents();
    this.shapeView = undefined;
    this.selection = undefined;
    this.drag = undefined;
    super.onDetach();
  }

  private bindEvents(): void {
    this.teardownEvents();

    this.eventOffs.push(
      this.node.events.on(BlockPuzzleEvents.SlotPressed, (event) => {
        this.selectSlot(event);
      }),
      this.node.events.on(BlockPuzzleEvents.PlacementCompleted, () => {
        this.clearDrag();
      }),
      this.node.events.on(BlockPuzzleEvents.PlacementRejected, () => {
        this.returnToSlot();
      }),
    );

    this.inputOffs.push(
      this.node.engine.input.on('dragstart', (event) => this.startDrag(event)),
      this.node.engine.input.on('drag', (event) => this.moveDrag(event)),
      this.node.engine.input.on('dragend', (event) => this.finishDrag(event)),
      this.node.engine.input.on('pointerup', (event) => this.finishPointer(event)),
      this.node.engine.input.on('pointercancel', (event) => this.cancelPointer(event)),
    );
  }

  private teardownEvents(): void {
    for (const off of this.eventOffs) off();
    for (const off of this.inputOffs) off();
    this.eventOffs.length = 0;
    this.inputOffs.length = 0;
  }

  private async initializeShapeView(): Promise<void> {
    const scopeVersion = this.getComponentScopeVersion();
    const dragLayer = this.node.getChildContainer(this.config.dragLayerPath);
    const cells: Container[] = [];
    const cellCount = this.gameplay.getMaxShapeCellCount();

    for (let index = 0; index < cellCount; index += 1) {
      const spawned = await this.awaitComponentScopeResource(
        dragLayer.spawnPrefab<Container>({
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

    this.shapeView = new BlockPuzzleShapeView(cells);
  }

  private selectSlot(event: AppEvent): void {
    if (this.drag !== undefined) return;

    const payload = SchemaDecoder.decode(
      event.payload,
      BlockPuzzleEventSchemas.SlotPressed,
      BlockPuzzleEvents.SlotPressed,
    );
    if (this.gameplay.getShape(payload.slotId) === null) return;

    this.selection = payload;
  }

  private startDrag(event: InputEventBase): void {
    const selection = this.selection;
    const shapeView = this.shapeView;
    if (
      selection === undefined
      || selection.pointerId !== event.pointerId
      || shapeView === undefined
    ) {
      return;
    }

    const shape = this.gameplay.getShape(selection.slotId);
    if (shape === null) return;

    this.drag = {
      ...selection,
      shape,
      preview: this.emptyPreview(),
      phase: 'dragging',
    };
    const dragLayer = this.node.getChildContainer(this.config.dragLayerPath);
    const boardScale = this.getBoardScale();

    this.node.engine.tweens.kill(dragLayer);
    shapeView.render(
      shape,
      this.geometry.boardCellSize,
      this.geometry.boardGap,
    );
    dragLayer.setScale(boardScale);
    this.updateDrag(event);
    this.node.events.emit({
      type: BlockPuzzleEvents.DragStarted,
      data: { slotId: selection.slotId },
    });
  }

  private moveDrag(event: InputEventBase): void {
    if (
      this.drag?.pointerId === event.pointerId
      && this.drag.phase === 'dragging'
    ) {
      this.updateDrag(event);
    }
  }

  private finishDrag(event: InputEventBase): void {
    const drag = this.drag;
    if (
      drag?.pointerId !== event.pointerId
      || drag.phase !== 'dragging'
    ) {
      return;
    }

    if (event.dragEndReason === 'pointercancel') {
      this.returnToSlot();
      return;
    }

    const anchor = this.resolveAnchor(event, drag.shape);
    if (!drag.preview.valid) {
      this.node.events.emit({
        type: BlockPuzzleEvents.InvalidDrop,
        data: { slotId: drag.slotId },
      });
      this.returnToSlot();
      return;
    }

    drag.phase = 'snapping';
    this.trackTask(this.snapAndRequestPlacement(drag, anchor));
  }

  private finishPointer(event: InputEventBase): void {
    if (this.selection?.pointerId === event.pointerId && this.drag === undefined) {
      this.selection = undefined;
    }
  }

  private cancelPointer(event: InputEventBase): void {
    if (this.drag?.pointerId === event.pointerId) {
      this.returnToSlot();
      return;
    }
    this.finishPointer(event);
  }

  private updateDrag(event: InputEventBase): void {
    const drag = this.drag;
    if (drag === undefined || drag.phase !== 'dragging') return;

    this.node
      .getChildContainer(this.config.dragLayerPath)
      .setPosition(event.virtual);
    drag.preview = this.gameplay.previewPlacement(
      drag.slotId,
      this.resolveAnchor(event, drag.shape),
    );
    this.node.events.emit({
      type: BlockPuzzleEvents.PreviewChanged,
      data: drag.preview,
    });
  }

  private resolveAnchor(
    event: InputEventBase,
    shape: ShapeDefinition,
  ): CellCoordinate {
    const local = this.node
      .getChildContainer(this.config.boardPath)
      .toLocalPosition(event.virtual);
    const size = this.getShapeView().resolveSize(
      shape,
      this.geometry.boardCellSize,
      this.geometry.boardGap,
    );
    const step = this.geometry.boardStep;

    return {
      row: Math.round((local.y - size.height / 2) / step),
      column: Math.round((local.x - size.width / 2) / step),
    };
  }

  private returnToSlot(): void {
    const drag = this.drag;
    if (drag === undefined || drag.phase === 'returning') return;

    const dragLayer = this.node.getChildContainer(this.config.dragLayerPath);
    const slot = this.node
      .getChildContainer(this.config.slotsPath)
      .getChildContainer(`slot-${drag.slotId}`);
    const target = this.node.toLocalPosition(slot.getGlobalPosition());

    drag.phase = 'returning';
    this.node.engine.tweens.kill(dragLayer);
    this.clearPreview();
    this.animateReturn(drag, dragLayer, target);
  }

  private animateReturn(
    drag: DragSession,
    dragLayer: Container,
    target: { readonly x: number; readonly y: number },
  ): void {
    const slotScale =
      this.getBoardScale()
      * this.geometry.slotCellSize
      / this.geometry.boardCellSize;

    this.ownTween(
      dragLayer.tweens.scaleTo(slotScale, this.config.returnDuration, {
        ease: 'power2.out',
      }),
    );
    this.ownTween(
      dragLayer.tweens.moveTo(target, this.config.returnDuration, {
        ease: 'power2.out',
        onComplete: () => {
          if (this.drag !== drag) return;
          this.node.events.emit({
            type: BlockPuzzleEvents.DragCancelled,
            data: { slotId: drag.slotId },
          });
          this.clearDrag();
        },
      }),
    );
  }

  private clearDrag(): void {
    const dragLayer = this.node.getChildContainer(this.config.dragLayerPath);
    this.node.engine.tweens.kill(dragLayer);
    this.shapeView?.hide();
    this.selection = undefined;
    this.drag = undefined;
    this.clearPreview();
  }

  private async snapAndRequestPlacement(
    drag: DragSession,
    anchor: CellCoordinate,
  ): Promise<void> {
    const dragLayer = this.node.getChildContainer(this.config.dragLayerPath);
    const target = this.resolveSnapTarget(drag);
    const scopeVersion = this.getComponentScopeVersion();
    const snapTween = this.ownTween(
      dragLayer.tweens.moveTo(target, this.config.snapDuration, {
        ease: 'power2.out',
      }),
    );
    const stillActive = await this.continueComponentScope(
      snapTween.then(),
      scopeVersion,
    );
    if (
      !stillActive
      || this.drag !== drag
      || drag.phase !== 'snapping'
    ) {
      return;
    }

    this.clearPreview();
    this.node.events.emit({
      type: BlockPuzzleEvents.PlacementRequested,
      data: {
        slotId: drag.slotId,
        anchor,
      },
    });
  }

  private resolveSnapTarget(
    drag: DragSession,
  ): { readonly x: number; readonly y: number } {
    const firstPreviewCell = drag.preview.cells[0];
    if (firstPreviewCell === undefined) {
      throw new Error('BlockPuzzleDragComponent: valid preview has no cells');
    }

    const board = this.node.getChildContainer(this.config.boardPath);
    const previewTile = board
      .getChildContainer('preview')
      .getChildContainer(
        `preview-${firstPreviewCell.row}-${firstPreviewCell.column}`,
      );
    const previewPosition = previewTile.getGlobalPosition();
    const shapeCellPosition = this.getShapeView().resolveCellPosition(
      drag.shape,
      0,
      this.geometry.boardCellSize,
      this.geometry.boardGap,
    );
    const boardScale = this.getBoardScale();

    return this.node.toLocalPosition({
      x: previewPosition.x - shapeCellPosition.x * boardScale,
      y: previewPosition.y - shapeCellPosition.y * boardScale,
    });
  }

  private clearPreview(): void {
    this.node.events.emit({
      type: BlockPuzzleEvents.PreviewChanged,
      data: this.emptyPreview(),
    });
  }

  private getBoardScale(): number {
    return this.node
      .getChildContainer(this.config.responsiveRootPath)
      .getComponent<ResponsiveLayoutComponent>('responsiveLayout')
      .getLayoutSnapshot()
      .scale;
  }

  private emptyPreview(): PlacementPreview {
    return {
      valid: false,
      color: 0,
      cells: [],
      completedLines: { rows: [], columns: [] },
    };
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

  private getShapeView(): BlockPuzzleShapeView {
    const shapeView = this.shapeView;
    if (shapeView === undefined) {
      throw new Error('BlockPuzzleDragComponent: shape view is not initialized');
    }
    return shapeView;
  }
}
