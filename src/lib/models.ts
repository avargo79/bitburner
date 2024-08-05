import { Player, ResetInfo, Server } from "@ns";

export interface IScriptPlayer extends Player {
    hasTorRouter: boolean;
}

export interface IScriptServer extends Server {
    files: string[];
    pids: { filename: string, threads: number, args: any[], pid: number, temporary: boolean }[];
    hack: {
        wkTime: number;
        grTime: number;
        hkTime: number;
    };
}

export interface IScriptResetInfo extends ResetInfo {
}

export interface IScriptContract {
    id: string;
    type: string;
    file: string;
    hostname: string;
    data: string;
    numTriesRemaining: number;
    solved: boolean;
}

export class ScriptServer {
    constructor(public server: IScriptServer) { }

    public get files() {
        return this.server.files;
    }

    public get needsPrep() {
        return this.security.current > this.security.min || this.money.current < this.money.max;
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
        return !this.purchasedByPlayer && this.hostname !== 'home' && this.money.max > 0 && (this.ports.open ?? 0) >= (this.ports.required ?? 0) && this.hasAdminRights;
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
            available: (this.server.maxRam ?? 0) - (this.server.ramUsed ?? 0),
            used: this.server.ramUsed ?? 0,
            max: this.server.maxRam ?? 0
        };
    }
}