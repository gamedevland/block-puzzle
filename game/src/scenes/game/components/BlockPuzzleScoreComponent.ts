import { BaseTypedComponent } from '@gamedevland/engine/layouts';
import { SchemaDecoder } from '@gamedevland/engine/validation';

import { BlockPuzzleEventSchemas } from '../configs/event.schemas';
import { BlockPuzzleEvents } from '../configs/events';

import type { AppEvent } from '@gamedevland/engine/events';
import type {
  ResponsiveLayoutComponent,
  Text,
} from '@gamedevland/engine/layouts';
import type { InferDecoded } from '@gamedevland/engine/validation';

const ConfigDecoder = SchemaDecoder.object({
  popScale: SchemaDecoder.number({ min: 1 }),
  popDuration: SchemaDecoder.number({ min: 0 }),
});

type BlockPuzzleScoreConfig = InferDecoded<typeof ConfigDecoder>;

export class BlockPuzzleScoreComponent extends BaseTypedComponent<
  BlockPuzzleScoreConfig,
  Text
> {
  protected override readonly configDecoder = ConfigDecoder;

  private readonly eventOffs: Array<() => void> = [];
  private baseScale = 1;

  protected override onReady(): void {
    this.refreshBaseScale();
  }

  protected override onEnable(): void {
    this.teardownEvents();
    this.eventOffs.push(
      this.node.events.on(BlockPuzzleEvents.ScoreChanged, (event) =>
        this.updateScore(event),
      ),
      this.node.events.on('SCREEN_CHANGED', () => {
        this.killOwnedTweens();
        this.refreshBaseScale();
      }),
    );
  }

  protected override onDisable(): void {
    this.teardownEvents();
    this.killOwnedTweens();
    this.node.setScale(this.baseScale);
  }

  override onDetach(): void {
    this.teardownEvents();
    super.onDetach();
  }

  private updateScore(event: AppEvent): void {
    const payload = SchemaDecoder.decode(
      event.payload,
      BlockPuzzleEventSchemas.ScoreChanged,
      BlockPuzzleEvents.ScoreChanged,
    );
    this.node.setText(String(payload.score));
    if (payload.delta === 0) return;

    this.playScorePop();
  }

  private playScorePop(): void {
    this.killOwnedTweens();
    this.node.setScale(this.baseScale * this.config.popScale);
    this.ownTween(
      this.node.tweens.scaleTo(this.baseScale, this.config.popDuration, {
        ease: 'back.out(2)',
      }),
    );
  }

  private refreshBaseScale(): void {
    this.baseScale = this.node
      .getComponent<ResponsiveLayoutComponent>('responsiveLayout')
      .refresh()
      .scale;
  }

  private teardownEvents(): void {
    for (const off of this.eventOffs) off();
    this.eventOffs.length = 0;
  }
}
