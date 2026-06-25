import { BaseTypedComponent } from '@gamedevland/engine/layouts';
import { SchemaDecoder } from '@gamedevland/engine/validation';

import { BlockPuzzleServices } from '../BlockPuzzleServices';
import { BlockPuzzleEventSchemas } from '../configs/event.schemas';
import { BlockPuzzleEvents } from '../configs/events';

import type { BlockPuzzleGeometryService } from '../services/BlockPuzzleGeometryService';
import type { AppEvent } from '@gamedevland/engine/events';
import type { Container } from '@gamedevland/engine/layouts';
import type { InferDecoded } from '@gamedevland/engine/validation';

const ConfigDecoder = SchemaDecoder.object({
  actionId: SchemaDecoder.string({ nonEmpty: true }),
});

type BlockPuzzleBoardEffectsConfig = InferDecoded<typeof ConfigDecoder>;

export class BlockPuzzleBoardEffectsComponent extends BaseTypedComponent<
  BlockPuzzleBoardEffectsConfig,
  Container
> {
  protected override readonly configDecoder = ConfigDecoder;

  private eventOff: (() => void) | undefined;

  protected override onEnable(): void {
    this.eventOff?.();
    this.eventOff = this.node.events.on(BlockPuzzleEvents.LinesCleared, (event) => {
      this.playLineClear(event);
    });
  }

  protected override onDisable(): void {
    this.eventOff?.();
    this.eventOff = undefined;
    this.node.cancelAction(this.config.actionId);
  }

  override onDetach(): void {
    this.eventOff?.();
    this.eventOff = undefined;
    this.node.cancelAction(this.config.actionId);
    super.onDetach();
  }

  private playLineClear(event: AppEvent): void {
    const payload = SchemaDecoder.decode(
      event.payload,
      BlockPuzzleEventSchemas.LinesCleared,
      BlockPuzzleEvents.LinesCleared,
    );

    for (const cell of payload.cells) {
      this.trackTask(
        this.node.runAction(this.config.actionId, {
          position: this.cellPosition(cell.row, cell.column),
        }),
      );
    }
  }

  private cellPosition(
    row: number,
    column: number,
  ): { readonly x: number; readonly y: number } {
    return this.geometry.getBoardCellPosition({ row, column });
  }

  private get geometry(): BlockPuzzleGeometryService {
    return this.node.engine
      .getRequiredActiveSceneDi()
      .get(BlockPuzzleServices.Geometry);
  }
}
