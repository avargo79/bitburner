import { Server } from "@ns";

export interface IScriptServer extends Server {
    files: string[];
    pids: { filename: string; threads: number; args: any[]; pid: number; temporary: boolean; }[];
    hackData: {
        wkTime: number;
        grTime: number;
        hkTime: number;
    };
    lastUpdated: number;
}

export class ScriptServer {
    constructor(public server: IScriptServer) { }

    public get files() {
        return this.server.files;
    }

    public get needsPrep() {
        return this.hasAdminRights && this.money.max > 0 && (this.security.current > this.security.min || this.money.current < this.money.max);
    }

    public get hostname() {
        return this.server.hostname;
    }

    public get hasAdminRights() {
        return this.server.hasAdminRights;
    }

    public get backdoorInstalled() {
        return !!this.server.backdoorInstalled;
    }
    public get power() {
        return Math.max(0, Math.log2(this.ram.max));
    }

    public get isTarget() {
        return !this.purchasedByPlayer && this.hostname !== 'home' && this.money.max > 0 && this.ports.open >= this.ports.required && this.hasAdminRights;
    }

    public get isAttacker() {
        return this.purchasedByPlayer || this.hostname === 'home' || (this.ram.max > 0 && this.hasAdminRights);
    }

    public get purchasedByPlayer() {
        return this.server.purchasedByPlayer;
    }

    public get requiredHackingSkill() {
        return this.server.requiredHackingSkill ?? 0;
    }

    public get ports() {
        return {
            required: this.server.numOpenPortsRequired ?? 0,
            open: this.server.openPortCount ?? 0,
        };
    }

    public get security() {
        return {
            current: this.server.hackDifficulty ?? 0,
            min: this.server.minDifficulty ?? 0,
        };
    }

    public get money() {
        return {
            current: this.server.moneyAvailable ?? 0,
            max: this.server.moneyMax ?? 0
        };
    }

    public get ram() {
        return {
            available: this.server.maxRam - this.server.ramUsed,
            used: this.server.ramUsed ?? 0,
            max: this.server.maxRam ?? 0
        };
    }

    public get lastUpdated() {
        return this.server.lastUpdated;
    }
}
