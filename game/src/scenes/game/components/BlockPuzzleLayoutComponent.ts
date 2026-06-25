import { BaseTypedComponent } from '@gamedevland/engine/layouts';
import { SchemaDecoder } from '@gamedevland/engine/validation';

import { BlockPuzzleServices } from '../BlockPuzzleServices';
import { BlockPuzzleSlots } from '../domain/BlockPuzzleSlots';

import type { BlockPuzzleGeometryService } from '../services/BlockPuzzleGeometryService';
import type {
  Container,
  ResponsiveLayoutComponent,
} from '@gamedevland/engine/layouts';
import type { InferDecoded } from '@gamedevland/engine/validation';

const ConfigDecoder = SchemaDecoder.object({});

type BlockPuzzleLayoutConfig = InferDecoded<typeof ConfigDecoder>;

export class BlockPuzzleLayoutComponent extends BaseTypedComponent<
  BlockPuzzleLayoutConfig,
  Container
> {
  protected override readonly configDecoder = ConfigDecoder;

  private unsubscribeScreen: (() => void) | undefined;

  protected override onEnable(): void {
    this.applyLayout();
    this.unsubscribeScreen = this.node.events.on('SCREEN_CHANGED', () => {
      this.applyLayout();
    });
  }

  protected override onDisable(): void {
    this.unsubscribeScreen?.();
    this.unsubscribeScreen = undefined;
  }

  override onDetach(): void {
    this.unsubscribeScreen?.();
    this.unsubscribeScreen = undefined;
    super.onDetach();
  }

  private applyLayout(): void {
    this.applyGeometry();
    const snapshot = this.node
      .getComponent<ResponsiveLayoutComponent>('responsiveLayout')
      .refresh();
    const x =
      snapshot.area.x
      + (snapshot.area.width - this.geometry.compositionWidth * snapshot.scale) / 2;
    const y =
      snapshot.area.y
      + snapshot.area.height / 2
      - this.geometry.boardHeight * snapshot.scale / 2;

    this.node.setPosition(Math.round(x), Math.round(y));
  }

  private applyGeometry(): void {
    const geometry = this.geometry;
    this.node
      .getChildGraphics('bounds')
      .setWidth(geometry.compositionWidth)
      .setHeight(geometry.compositionHeight);
    this.node
      .getChildContainer('board')
      .getChildGraphics('bounds')
      .setWidth(geometry.boardWidth)
      .setHeight(geometry.boardHeight);

    const slots = this.node
      .getChildContainer('slots')
      .setY(geometry.slotsY);
    slots
      .getChildGraphics('bounds')
      .setWidth(geometry.compositionWidth)
      .setHeight(geometry.slotsHeight);

    for (let slotId = 0; slotId < BlockPuzzleSlots.Count; slotId += 1) {
      const center = geometry.getSlotCenter(slotId);
      const slot = slots
        .getChildContainer(`slot-${slotId}`)
        .setPosition(center);
      slot
        .getChildGraphics('hitArea')
        .setPosition(
          -geometry.slotHitWidth / 2,
          -geometry.slotHitHeight / 2,
        )
        .setWidth(geometry.slotHitWidth)
        .setHeight(geometry.slotHitHeight);
    }
  }

  private get geometry(): BlockPuzzleGeometryService {
    return this.node.engine
      .getRequiredActiveSceneDi()
      .get(BlockPuzzleServices.Geometry);
  }
}
