import { NS, BitNodeMultipliers, ResetInfo } from "@ns";

export interface SourceFile {
  n: number;
  lvl: number;
}

export class BitnodeDetector {
  private ns: NS;
  private resetInfo: ResetInfo | null = null;
  private bitNodeMults: BitNodeMultipliers | null = null;
  private sourceFiles: Map<number, number> = new Map();
  private initialized = false;

  constructor(ns: NS) {
    this.ns = ns;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get reset info (always available)
      this.resetInfo = this.ns.getResetInfo();

      // Get BitNode multipliers (requires SF-5)
      this.bitNodeMults = await this.tryGetBitNodeMultipliers();

      // Get owned source files
      this.sourceFiles = await this.getActiveSourceFiles();

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize BitnodeDetector: ${error}`);
    }
  }

  private async tryGetBitNodeMultipliers(): Promise<BitNodeMultipliers | null> {
    try {
      return this.ns.getBitNodeMultipliers();
    } catch {
      // SF-5 not available, use default multipliers (all 1.0)
      return null;
    }
  }

  private async getActiveSourceFiles(): Promise<Map<number, number>> {
    const sourceFiles = new Map<number, number>();
    
    try {
      const ownedSFs = this.ns.singularity.getOwnedSourceFiles();
      for (const sf of ownedSFs) {
        sourceFiles.set(sf.n, sf.lvl);
      }
    } catch {
      // Singularity API not available (SF-4 not owned)
      // Return empty map
    }

    return sourceFiles;
  }

  getCurrentBitnode(): number {
    this.ensureInitialized();
    return this.resetInfo?.currentNode ?? 1;
  }

  getCurrentBitnodeName(): string {
    const bitnodeNames: Record<number, string> = {
      1: "Source Genesis",
      2: "Rise of the Underworld",
      3: "Corporatocracy",
      4: "The Singularity",
      5: "Artificial Intelligence",
      6: "Bladeburners",
      7: "Bladeburners 2079",
      8: "Ghost of Wall Street",
      9: "Hacktocracy",
      10: "Digital Carbon",
      11: "The Big Crash",
      12: "The Recursion",
      13: "They're lunatics",
    };

    const bn = this.getCurrentBitnode();
    return bitnodeNames[bn] ?? `BitNode-${bn}`;
  }

  hasSourceFile(sfNum: number, minLevel: number = 1): boolean {
    this.ensureInitialized();
    const level = this.sourceFiles.get(sfNum) ?? 0;
    return level >= minLevel;
  }

  getSourceFileLevel(sfNum: number): number {
    this.ensureInitialized();
    return this.sourceFiles.get(sfNum) ?? 0;
  }

  getBitNodeMult(key: keyof BitNodeMultipliers): number {
    this.ensureInitialized();
    
    // If we don't have multipliers (SF-5 not available), assume 1.0
    if (!this.bitNodeMults) return 1.0;
    
    return this.bitNodeMults[key] ?? 1.0;
  }

  isHackIncomeViable(): boolean {
    this.ensureInitialized();
    
    // Check if hacking provides meaningful income
    const hackMoneyMult = this.getBitNodeMult("ScriptHackMoney");
    const hackMoneyGainMult = this.getBitNodeMult("ScriptHackMoneyGain");
    
    return hackMoneyMult * hackMoneyGainMult > 0;
  }

  isStockMarketViable(): boolean {
    this.ensureInitialized();
    
    // Check if stock market is available and worthwhile
    const fourSigmaMarketDataCost = this.getBitNodeMult("FourSigmaMarketDataCost");
    const fourSigmaMarketDataApiCost = this.getBitNodeMult("FourSigmaMarketDataApiCost");
    
    // If costs are astronomical, stock market isn't viable
    return fourSigmaMarketDataCost < 100 && fourSigmaMarketDataApiCost < 100;
  }

  isCorporationViable(): boolean {
    this.ensureInitialized();
    
    const corpValuationMult = this.getBitNodeMult("CorporationValuation");
    
    // Corporation must provide value
    return corpValuationMult > 0;
  }

  isBladeburnerViable(): boolean {
    this.ensureInitialized();
    
    // Bladeburner disabled in some nodes
    const bn = this.getCurrentBitnode();
    return bn !== 8; // Disabled in BN8 (Ghost of Wall Street)
  }

  isGangViable(): boolean {
    this.ensureInitialized();
    
    const gangSoftcap = this.getBitNodeMult("GangSoftcap");
    
    // Gang must not be completely nerfed
    return gangSoftcap > 0;
  }

  hasSingularityAccess(): boolean {
    return this.hasSourceFile(4, 1);
  }

  hasFormulasAccess(): boolean {
    return this.hasSourceFile(5, 1);
  }

  hasBladeburnerAccess(): boolean {
    return this.hasSourceFile(6, 1) || this.hasSourceFile(7, 1);
  }

  hasStockMarketAccess(): boolean {
    return this.hasSourceFile(8, 1);
  }

  hasCorporationAccess(): boolean {
    return this.hasSourceFile(3, 1);
  }

  hasGangAccess(): boolean {
    return this.hasSourceFile(2, 1);
  }

  hasSleevesAccess(): boolean {
    return this.hasSourceFile(10, 1);
  }

  hasStanekAccess(): boolean {
    return this.hasSourceFile(13, 1);
  }

  getResetInfo(): ResetInfo | null {
    this.ensureInitialized();
    return this.resetInfo;
  }

  getAllSourceFiles(): Map<number, number> {
    this.ensureInitialized();
    return new Map(this.sourceFiles);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("BitnodeDetector not initialized. Call initialize() first.");
    }
  }

  // Debug helper
  toString(): string {
    this.ensureInitialized();
    
    const sfs = Array.from(this.sourceFiles.entries())
      .map(([n, lvl]) => `SF-${n}.${lvl}`)
      .join(", ");
    
    return `BitNode ${this.getCurrentBitnode()} (${this.getCurrentBitnodeName()}), Source Files: ${sfs || "none"}`;
  }
}
