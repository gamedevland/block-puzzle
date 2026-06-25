export interface BlockPuzzleScoreRulesConfig {
  readonly pointsPerPlacedCell: number;
  readonly pointsPerClearedLine: number;
  readonly multiLineBonus: number;
}

export class BlockPuzzleScoreRules {
  constructor(private readonly config: BlockPuzzleScoreRulesConfig) {}

  calculate(placedCellCount: number, clearedLineCount: number): number {
    const placementPoints = placedCellCount * this.config.pointsPerPlacedCell;
    const linePoints = clearedLineCount * this.config.pointsPerClearedLine;
    const multiLineBonus = clearedLineCount >= 2 ? this.config.multiLineBonus : 0;
    return placementPoints + linePoints + multiLineBonus;
  }
}
