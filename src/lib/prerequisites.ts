import { NS } from "@ns";
import { BitnodeDetector } from "/lib/bitnode-detector";

export type RequirementType = 
  | "source-file"
  | "home-ram"
  | "hack-level"
  | "money"
  | "server-exists"
  | "custom";

export interface Requirement {
  type: RequirementType;
  description: string;
}

export interface SourceFileRequirement extends Requirement {
  type: "source-file";
  sfNum: number;
  minLevel?: number;
}

export interface HomeRamRequirement extends Requirement {
  type: "home-ram";
  minRam: number;
}

export interface HackLevelRequirement extends Requirement {
  type: "hack-level";
  minLevel: number;
}

export interface MoneyRequirement extends Requirement {
  type: "money";
  minMoney: number;
}

export interface ServerExistsRequirement extends Requirement {
  type: "server-exists";
  hostname: string;
}

export interface CustomRequirement extends Requirement {
  type: "custom";
  check: () => boolean | Promise<boolean>;
}

export type AnyRequirement = 
  | SourceFileRequirement
  | HomeRamRequirement
  | HackLevelRequirement
  | MoneyRequirement
  | ServerExistsRequirement
  | CustomRequirement;

export class Prerequisites {
  private ns: NS;
  private detector: BitnodeDetector;

  constructor(ns: NS, detector: BitnodeDetector) {
    this.ns = ns;
    this.detector = detector;
  }

  async check(req: AnyRequirement): Promise<boolean> {
    try {
      switch (req.type) {
        case "source-file":
          return this.checkSourceFile(req);
        case "home-ram":
          return this.checkHomeRam(req);
        case "hack-level":
          return this.checkHackLevel(req);
        case "money":
          return this.checkMoney(req);
        case "server-exists":
          return this.checkServerExists(req);
        case "custom":
          return await this.checkCustom(req);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  async checkAll(reqs: AnyRequirement[]): Promise<boolean> {
    const results = await Promise.all(reqs.map(req => this.check(req)));
    return results.every(result => result);
  }

  async getFailureReason(req: AnyRequirement): Promise<string | null> {
    const passed = await this.check(req);
    if (passed) return null;

    switch (req.type) {
      case "source-file":
        return this.getSourceFileFailureReason(req);
      case "home-ram":
        return this.getHomeRamFailureReason(req);
      case "hack-level":
        return this.getHackLevelFailureReason(req);
      case "money":
        return this.getMoneyFailureReason(req);
      case "server-exists":
        return `Server "${req.hostname}" does not exist`;
      case "custom":
        return req.description || "Custom requirement not met";
      default:
        return "Unknown requirement type";
    }
  }

  async getAllFailureReasons(reqs: AnyRequirement[]): Promise<string[]> {
    const reasons: string[] = [];
    for (const req of reqs) {
      const reason = await this.getFailureReason(req);
      if (reason) reasons.push(reason);
    }
    return reasons;
  }

  private checkSourceFile(req: SourceFileRequirement): boolean {
    const minLevel = req.minLevel ?? 1;
    return this.detector.hasSourceFile(req.sfNum, minLevel);
  }

  private checkHomeRam(req: HomeRamRequirement): boolean {
    const homeRam = this.ns.getServerMaxRam("home");
    return homeRam >= req.minRam;
  }

  private checkHackLevel(req: HackLevelRequirement): boolean {
    const player = this.ns.getPlayer();
    return player.skills.hacking >= req.minLevel;
  }

  private checkMoney(req: MoneyRequirement): boolean {
    const player = this.ns.getPlayer();
    return player.money >= req.minMoney;
  }

  private checkServerExists(req: ServerExistsRequirement): boolean {
    return this.ns.serverExists(req.hostname);
  }

  private async checkCustom(req: CustomRequirement): Promise<boolean> {
    try {
      return await req.check();
    } catch {
      return false;
    }
  }

  private getSourceFileFailureReason(req: SourceFileRequirement): string {
    const currentLevel = this.detector.getSourceFileLevel(req.sfNum);
    const minLevel = req.minLevel ?? 1;
    
    if (currentLevel === 0) {
      return `Requires Source File ${req.sfNum} (not owned)`;
    } else {
      return `Requires Source File ${req.sfNum} level ${minLevel} (current: ${currentLevel})`;
    }
  }

  private getHomeRamFailureReason(req: HomeRamRequirement): string {
    const homeRam = this.ns.getServerMaxRam("home");
    return `Requires ${this.ns.formatRam(req.minRam)} home RAM (current: ${this.ns.formatRam(homeRam)})`;
  }

  private getHackLevelFailureReason(req: HackLevelRequirement): string {
    const player = this.ns.getPlayer();
    return `Requires hack level ${req.minLevel} (current: ${player.skills.hacking})`;
  }

  private getMoneyFailureReason(req: MoneyRequirement): string {
    const player = this.ns.getPlayer();
    return `Requires ${this.ns.formatNumber(req.minMoney)} (current: ${this.ns.formatNumber(player.money)})`;
  }
}

// Helper functions to create requirements

export function requireSourceFile(sfNum: number, minLevel: number = 1, description?: string): SourceFileRequirement {
  return {
    type: "source-file",
    sfNum,
    minLevel,
    description: description ?? `Source File ${sfNum} level ${minLevel}`,
  };
}

export function requireHomeRam(minRam: number, description?: string): HomeRamRequirement {
  return {
    type: "home-ram",
    minRam,
    description: description ?? `${minRam}GB home RAM`,
  };
}

export function requireHackLevel(minLevel: number, description?: string): HackLevelRequirement {
  return {
    type: "hack-level",
    minLevel,
    description: description ?? `Hack level ${minLevel}`,
  };
}

export function requireMoney(minMoney: number, description?: string): MoneyRequirement {
  return {
    type: "money",
    minMoney,
    description: description ?? `$${minMoney.toLocaleString()}`,
  };
}

export function requireServerExists(hostname: string, description?: string): ServerExistsRequirement {
  return {
    type: "server-exists",
    hostname,
    description: description ?? `Server "${hostname}" exists`,
  };
}

export function requireCustom(check: () => boolean | Promise<boolean>, description: string): CustomRequirement {
  return {
    type: "custom",
    check,
    description,
  };
}
