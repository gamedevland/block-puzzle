import { BaseTypedComponent } from '@gamedevland/engine/layouts';
import { SchemaDecoder } from '@gamedevland/engine/validation';

import { BlockPuzzleServices } from '../BlockPuzzleServices';
import { BlockPuzzleEventSchemas } from '../configs/event.schemas';
import { BlockPuzzleEvents } from '../configs/events';

import type { BlockPuzzlePlacementCompletedPayload } from '../configs/event.schemas';
import type {
  BoardSnapshot,
  CellCoordinate,
  PlacementPreview,
} from '../domain/BlockPuzzleTypes';
import type { BlockPuzzleGeometryService } from '../services/BlockPuzzleGeometryService';
import type { AppEvent } from '@gamedevland/engine/events';
import type { Container } from '@gamedevland/engine/layouts';
import type { InferDecoded } from '@gamedevland/engine/validation';

const ConfigDecoder = SchemaDecoder.object({
  cellPrefab: SchemaDecoder.string({ nonEmpty: true }),
  tilePrefab: SchemaDecoder.string({ nonEmpty: true }),
  previewAlpha: SchemaDecoder.number({ min: 0, max: 1 }),
  linePreviewAlpha: SchemaDecoder.number({ min: 0, max: 1 }),
  linePreviewTintAmount: SchemaDecoder.number({ min: 0, max: 1 }),
  linePreviewPulseScale: SchemaDecoder.number({ min: 1 }),
  linePreviewPulseDuration: SchemaDecoder.number({ min: 0 }),
  placementPopScale: SchemaDecoder.number({ min: 1 }),
  placementPopDuration: SchemaDecoder.number({ min: 0 }),
  clearDuration: SchemaDecoder.number({ min: 0 }),
});

type BlockPuzzleBoardConfig = InferDecoded<typeof ConfigDecoder>;

export class BlockPuzzleBoardComponent extends BaseTypedComponent<
  BlockPuzzleBoardConfig,
  Container
> {
  protected override readonly configDecoder = ConfigDecoder;

  private readonly tiles = new Map<string, Container>();
  private readonly previewTiles = new Map<string, Container>();
  private readonly cellScales = new Map<Container, number>();
  private readonly eventOffs: Array<() => void> = [];
  private currentBoard: BoardSnapshot = [];
  private linePreviewSignature = '';
  private linePreviewKeys = new Set<string>();
  private visualsReady = false;

  protected override onReady(): void {
    this.trackTask(this.initializeVisuals());
  }

  protected override onEnable(): void {
    this.bindEvents();
  }

  protected override onDisable(): void {
    this.teardownEvents();
    this.killOwnedTweens();
    this.resetPreviewTiles();
    this.settleBoard();
  }

  override onDetach(): void {
    this.teardownEvents();
    this.tiles.clear();
    this.previewTiles.clear();
    this.cellScales.clear();
    this.currentBoard = [];
    this.linePreviewSignature = '';
    this.linePreviewKeys.clear();
    this.visualsReady = false;
    super.onDetach();
  }

  private bindEvents(): void {
    this.teardownEvents();
    this.eventOffs.push(
      this.node.events.on(BlockPuzzleEvents.BoardChanged, () => {
        this.renderBoard(this.gameplay.getBoardSnapshot());
      }),
      this.node.events.on(BlockPuzzleEvents.PlacementCompleted, (event) => {
        this.renderBoard(
          this.decodePlacementCompleted(event).boardBeforeClear,
        );
      }),
      this.node.events.on(BlockPuzzleEvents.PreviewChanged, (event) => {
        this.renderPreview(this.decodePreview(event));
      }),
    );
  }

  private teardownEvents(): void {
    for (const off of this.eventOffs) off();
    this.eventOffs.length = 0;
  }

  private async initializeVisuals(): Promise<void> {
    const scopeVersion = this.getComponentScopeVersion();
    const boardSize = this.gameplay.getBoardSize();
    const gridLayer = this.node.getChildContainer('grid');
    const tileLayer = this.node.getChildContainer('tiles');
    const previewLayer = this.node.getChildContainer('preview');

    for (let row = 0; row < boardSize.height; row += 1) {
      for (let column = 0; column < boardSize.width; column += 1) {
        const key = this.cellKey({ row, column });
        const position = this.cellPosition({ row, column });
        const grid = await this.awaitComponentScopeResource(
          gridLayer.spawnPrefab<Container>({
            prefabId: this.config.cellPrefab,
            localId: `cell-${key}`,
            overrides: position,
          }),
          (resource) => resource.dispose(),
          scopeVersion,
        );
        if (grid === undefined) return;
        this.prepareCellScale(grid.node);

        const tile = await this.awaitComponentScopeResource(
          tileLayer.spawnPrefab<Container>({
            prefabId: this.config.tilePrefab,
            localId: `tile-${key}`,
            overrides: {
              ...position,
              visible: false,
            },
          }),
          (resource) => resource.dispose(),
          scopeVersion,
        );
        if (tile === undefined) return;
        this.prepareCellScale(tile.node);

        const preview = await this.awaitComponentScopeResource(
          previewLayer.spawnPrefab<Container>({
            prefabId: this.config.tilePrefab,
            localId: `preview-${key}`,
            overrides: {
              ...position,
              visible: false,
            },
          }),
          (resource) => resource.dispose(),
          scopeVersion,
        );
        if (preview === undefined) return;
        this.prepareCellScale(preview.node);

        this.tiles.set(key, tile.node);
        this.previewTiles.set(key, preview.node);
      }
    }

    this.visualsReady = true;
    this.renderBoard(this.gameplay.getBoardSnapshot());
  }

  private renderBoard(nextBoard: BoardSnapshot): void {
    if (!this.visualsReady) {
      this.currentBoard = nextBoard;
      return;
    }

    const boardSize = this.gameplay.getBoardSize();
    for (let row = 0; row < boardSize.height; row += 1) {
      for (let column = 0; column < boardSize.width; column += 1) {
        const coordinate = { row, column };
        const key = this.cellKey(coordinate);
        const tile = this.requireCell(this.tiles, key);
        const previous = this.readBoardCell(this.currentBoard, coordinate);
        const next = this.readBoardCell(nextBoard, coordinate);

        if (next !== null) {
          tile.setTint(next.color).setVisible(true).setAlpha(1);
          if (previous === null) {
            this.node.engine.tweens.kill(tile);
            this.playPlacementPop(tile);
          }
          continue;
        }

        if (previous !== null) {
          this.playClear(tile, previous.color, coordinate);
        } else {
          tile.setVisible(false);
        }
      }
    }
    this.currentBoard = nextBoard;
  }

  private playPlacementPop(tile: Container): void {
    const scale = this.requireCellScale(tile);
    tile.setScale(scale * this.config.placementPopScale);
    this.ownTween(
      tile.tweens.scaleTo(scale, this.config.placementPopDuration, {
        ease: 'back.out(2)',
      }),
    );
  }

  private playClear(
    tile: Container,
    color: number,
    coordinate: CellCoordinate,
  ): void {
    this.node.engine.tweens.kill(tile);
    const scale = this.requireCellScale(tile);
    tile.setTint(color).setVisible(true).setScale(scale).setAlpha(1);

    this.ownTween(
      tile.tweens.scaleTo(scale * 0.15, this.config.clearDuration, {
        ease: 'power2.in',
      }),
    );
    this.ownTween(
      tile.tweens.fadeOut(this.config.clearDuration, {
        ease: 'power2.in',
        onComplete: () => this.finishClear(tile, coordinate),
      }),
    );
  }

  private finishClear(tile: Container, coordinate: CellCoordinate): void {
    if (this.readBoardCell(this.currentBoard, coordinate) === null) {
      tile
        .setVisible(false)
        .setScale(this.requireCellScale(tile))
        .setAlpha(1);
    }
  }

  private renderPreview(preview: PlacementPreview): void {
    if (!this.visualsReady) return;
    const previewKeys = new Set(preview.cells.map((cell) => this.cellKey(cell)));
    const completedRows = new Set(preview.completedLines.rows);
    const completedColumns = new Set(preview.completedLines.columns);
    const nextLinePreviewKeys = this.resolveLinePreviewKeys(
      preview,
      completedRows,
      completedColumns,
    );
    const nextSignature = [...nextLinePreviewKeys].sort().join('|');
    const linePreviewChanged = nextSignature !== this.linePreviewSignature;
    if (linePreviewChanged) {
      this.stopLinePreviewPulse();
      this.linePreviewSignature = nextSignature;
      this.linePreviewKeys = nextLinePreviewKeys;
    }

    const boardSize = this.gameplay.getBoardSize();
    for (let row = 0; row < boardSize.height; row += 1) {
      for (let column = 0; column < boardSize.width; column += 1) {
        const key = this.cellKey({ row, column });
        const tile = this.requireCell(this.previewTiles, key);
        const lineWillClear = completedRows.has(row) || completedColumns.has(column);
        const isShapeCell = previewKeys.has(key);
        if (!preview.valid || (!isShapeCell && !lineWillClear)) {
          this.hidePreviewTile(tile);
          continue;
        }
        const boardCell = this.readBoardCell(this.currentBoard, { row, column });
        const color = boardCell?.color ?? preview.color;
        tile
          .setTint(
            lineWillClear
              ? this.mixWithWhite(color, this.config.linePreviewTintAmount)
              : color,
          )
          .setAlpha(lineWillClear ? this.config.linePreviewAlpha : this.config.previewAlpha)
          .setVisible(true);
        if (lineWillClear && linePreviewChanged) {
          this.startLinePreviewPulse(tile);
        }
      }
    }
  }

  private resolveLinePreviewKeys(
    preview: PlacementPreview,
    completedRows: ReadonlySet<number>,
    completedColumns: ReadonlySet<number>,
  ): Set<string> {
    const keys = new Set<string>();
    if (!preview.valid) return keys;

    const boardSize = this.gameplay.getBoardSize();
    for (let row = 0; row < boardSize.height; row += 1) {
      for (let column = 0; column < boardSize.width; column += 1) {
        if (completedRows.has(row) || completedColumns.has(column)) {
          keys.add(this.cellKey({ row, column }));
        }
      }
    }
    return keys;
  }

  private startLinePreviewPulse(tile: Container): void {
    const scale = this.requireCellScale(tile);
    tile.setScale(scale);
    this.ownTween(
      tile.tweens.scaleTo(
        scale * this.config.linePreviewPulseScale,
        this.config.linePreviewPulseDuration,
        {
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        },
      ),
    );
  }

  private stopLinePreviewPulse(): void {
    for (const key of this.linePreviewKeys) {
      const tile = this.requireCell(this.previewTiles, key);
      this.node.engine.tweens.kill(tile);
      tile.setScale(this.requireCellScale(tile));
    }
  }

  private resetPreviewTiles(): void {
    this.stopLinePreviewPulse();
    for (const tile of this.previewTiles.values()) {
      this.node.engine.tweens.kill(tile);
      tile
        .setVisible(false)
        .setScale(this.requireCellScale(tile))
        .setAlpha(1);
    }
    this.linePreviewSignature = '';
    this.linePreviewKeys.clear();
  }

  private settleBoard(): void {
    if (!this.visualsReady) return;

    const boardSize = this.gameplay.getBoardSize();
    for (let row = 0; row < boardSize.height; row += 1) {
      for (let column = 0; column < boardSize.width; column += 1) {
        const coordinate = { row, column };
        const tile = this.requireCell(this.tiles, this.cellKey(coordinate));
        const cell = this.readBoardCell(this.currentBoard, coordinate);
        this.node.engine.tweens.kill(tile);
        if (cell === null) {
          tile
            .setVisible(false)
            .setScale(this.requireCellScale(tile))
            .setAlpha(1);
        } else {
          tile
            .setTint(cell.color)
            .setVisible(true)
            .setScale(this.requireCellScale(tile))
            .setAlpha(1);
        }
      }
    }
  }

  private hidePreviewTile(tile: Container): void {
    this.node.engine.tweens.kill(tile);
    tile
      .setVisible(false)
      .setScale(this.requireCellScale(tile))
      .setAlpha(1);
  }

  private prepareCellScale(cell: Container): void {
    const bounds = cell.getLocalBounds();
    const sourceSize = Math.max(bounds.width, bounds.height);
    if (sourceSize <= 0) {
      throw new Error(
        'BlockPuzzleBoardComponent: prefab must have positive local bounds',
      );
    }
    const scale = this.geometry.boardCellSize / sourceSize;
    this.cellScales.set(cell, scale);
    cell.setScale(scale);
  }

  private requireCellScale(cell: Container): number {
    const scale = this.cellScales.get(cell);
    if (scale === undefined) {
      throw new Error(
        'BlockPuzzleBoardComponent: prefab cell scale is not initialized',
      );
    }
    return scale;
  }

  private mixWithWhite(color: number, amount: number): number {
    const red = (color >> 16) & 0xff;
    const green = (color >> 8) & 0xff;
    const blue = color & 0xff;
    const mix = (channel: number): number =>
      Math.round(channel + (0xff - channel) * amount);

    return (mix(red) << 16) | (mix(green) << 8) | mix(blue);
  }

  private decodePreview(event: AppEvent): PlacementPreview {
    return SchemaDecoder.decode(
      event.payload,
      BlockPuzzleEventSchemas.PlacementPreview,
      BlockPuzzleEvents.PreviewChanged,
    );
  }

  private decodePlacementCompleted(
    event: AppEvent,
  ): BlockPuzzlePlacementCompletedPayload {
    return SchemaDecoder.decode(
      event.payload,
      BlockPuzzleEventSchemas.PlacementCompleted,
      BlockPuzzleEvents.PlacementCompleted,
    );
  }

  private get gameplay() {
    return this.node.engine
      .getRequiredActiveSceneDi()
      .get(BlockPuzzleServices.Gameplay);
  }

  private cellPosition(
    cell: CellCoordinate,
  ): { readonly x: number; readonly y: number } {
    return this.geometry.getBoardCellPosition(cell);
  }

  private get geometry(): BlockPuzzleGeometryService {
    return this.node.engine
      .getRequiredActiveSceneDi()
      .get(BlockPuzzleServices.Geometry);
  }

  private cellKey(cell: CellCoordinate): string {
    return `${cell.row}-${cell.column}`;
  }

  private readBoardCell(
    board: BoardSnapshot,
    cell: CellCoordinate,
  ): BoardSnapshot[number][number] {
    return board[cell.row]?.[cell.column] ?? null;
  }

  private requireCell(map: ReadonlyMap<string, Container>, key: string): Container {
    const cell = map.get(key);
    if (cell === undefined) {
      throw new Error(`BlockPuzzleBoardComponent: missing cell '${key}'`);
    }
    return cell;
  }
}
