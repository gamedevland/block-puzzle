import { BaseTypedComponent } from '@gamedevland/engine/layouts';
import { SchemaDecoder } from '@gamedevland/engine/validation';

import { BlockPuzzleEventSchemas } from '../configs/event.schemas';
import { BlockPuzzleEvents } from '../configs/events';

import type { AppEvent } from '@gamedevland/engine/events';
import type { InputEventBase } from '@gamedevland/engine/input';
import type {
  Container,
  ResponsiveLayoutComponent,
} from '@gamedevland/engine/layouts';
import type { InferDecoded } from '@gamedevland/engine/validation';

const ConfigDecoder = SchemaDecoder.object({
  restartEventType: SchemaDecoder.string({ nonEmpty: true }),
  blockerDuration: SchemaDecoder.number({ min: 0 }),
  panelDuration: SchemaDecoder.number({ min: 0 }),
});

type BlockPuzzleResultPopupConfig = InferDecoded<typeof ConfigDecoder>;
type BlockPuzzleResult = InferDecoded<
  typeof BlockPuzzleEventSchemas.ResultReady
>;

export class BlockPuzzleResultPopupComponent extends BaseTypedComponent<
  BlockPuzzleResultPopupConfig,
  Container
> {
  protected override readonly configDecoder = ConfigDecoder;

  private readonly eventOffs: Array<() => void> = [];
  private inputEnabled = false;
  private panelScale = 1;

  protected override onReady(): void {
    this.refreshLayout();
    this.node.hide();
  }

  protected override onEnable(): void {
    this.eventOffs.push(
      this.node.events.on(BlockPuzzleEvents.ResultReady, (event) => {
        this.open(event);
      }),
      this.node.events.on(BlockPuzzleEvents.SessionStarted, () => {
        this.hideImmediately();
      }),
      this.node.events.on('SCREEN_CHANGED', () => {
        this.refreshLayout();
      }),
      this.node
        .getChildContainer('panel.restartButton')
        .input.onTap((event) => this.restart(event)),
      this.node
        .getChildGraphics('blocker')
        .input.onTap((event) => event.stopPropagation()),
      this.node.input.on('pointerdown', (event) => event.stopPropagation()),
      this.node.input.on('pointermove', (event) => event.stopPropagation()),
      this.node.input.on('pointerup', (event) => event.stopPropagation()),
      this.node.input.on('pointercancel', (event) => event.stopPropagation()),
      this.node.input.on('dragstart', (event) => event.stopPropagation()),
      this.node.input.on('drag', (event) => event.stopPropagation()),
      this.node.input.on('dragend', (event) => event.stopPropagation()),
    );
  }

  protected override onDisable(): void {
    this.teardown();
    this.killOwnedTweens();
  }

  override onDetach(): void {
    this.teardown();
    super.onDetach();
  }

  private open(event: AppEvent): void {
    const result = SchemaDecoder.decode(
      event.payload,
      BlockPuzzleEventSchemas.ResultReady,
      BlockPuzzleEvents.ResultReady,
    );
    this.render(result);
    this.refreshLayout();
    this.prepareOpenState();
    this.node.show();
    this.playOpen();
  }

  private render(result: BlockPuzzleResult): void {
    this.node
      .getChildText('panel.scoreValue')
      .setText(String(result.score));
    this.node
      .getChildText('panel.bestValue')
      .setText(String(result.bestScore));
  }

  private prepareOpenState(): void {
    this.inputEnabled = false;
    this.killOwnedTweens();
    this.node.getChildGraphics('blocker').setAlpha(0);
    this.node
      .getChildContainer('panel')
      .setAlpha(0)
      .setScale(this.panelScale * 0.82);
  }

  private playOpen(): void {
    const blocker = this.node.getChildGraphics('blocker');
    const panel = this.node.getChildContainer('panel');

    this.ownTween(
      blocker.tweens.alphaTo(1, this.config.blockerDuration, {
        ease: 'sine.out',
      }),
    );
    this.ownTween(
      panel.tweens.alphaTo(1, this.config.panelDuration, {
        ease: 'sine.out',
      }),
    );
    this.ownTween(
      panel.tweens.scaleTo(this.panelScale, this.config.panelDuration, {
        ease: 'back.out(1.5)',
        onComplete: () => {
          this.inputEnabled = true;
        },
      }),
    );
  }

  private restart(event: InputEventBase): void {
    event.stopPropagation();
    if (!this.inputEnabled) return;

    this.inputEnabled = false;
    const button = this.node.getChildContainer('panel.restartButton');
    this.ownTween(
      button.tweens.scaleTo(0.9, 0.08, {
        ease: 'power1.out',
        onComplete: () => {
          button.setScale(1);
          this.node.events.emit({
            type: this.config.restartEventType,
            data: {},
          });
        },
      }),
    );
  }

  private refreshLayout(): void {
    this.node
      .getChildGraphics('blocker')
      .getComponent<ResponsiveLayoutComponent>('responsiveLayout')
      .refresh();
    this.panelScale = this.node
      .getChildContainer('panel')
      .getComponent<ResponsiveLayoutComponent>('responsiveLayout')
      .refresh()
      .scale;
  }

  private hideImmediately(): void {
    this.inputEnabled = false;
    this.killOwnedTweens();
    this.node.hide();
  }

  private teardown(): void {
    this.inputEnabled = false;
    for (const off of this.eventOffs) off();
    this.eventOffs.length = 0;
  }
}
