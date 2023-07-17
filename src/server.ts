import { NS } from "@ns";
import { reservedHomeRam } from "./constants";
import { getServerList } from "./utils";

export default class BaseServer {
	private ns: NS;
	private _id: string;

	constructor(ns: NS, id: string) {
		this.ns = ns;
		this._id = id;
	}

	get id() {
		return this._id;
	}
	get data() {
		return this.ns.getServer(this.id);
	}
	get updated_at() {
		return new Date().valueOf();
	}
	get hostname() {
		return this.data.hostname;
	}
	get admin() {
		return this.data.hasAdminRights;
	}
	get level() {
		return this.data.requiredHackingSkill ?? 0;
	}
	get purchased() {
		return this.data.purchasedByPlayer && this.data.hostname !== "home";
	}
	get connected() {
		return this.data.isConnectedTo;
	}
	get backdoored() {
		return this.data.backdoorInstalled;
	}
	get cores() {
		return this.data.cpuCores;
	}
	get ram() {
		return {
			used: this.data.ramUsed,
			max: this.data.maxRam - (this.data.hostname === "home" ? reservedHomeRam : 0),
			free: Math.max(0, this.data.maxRam - this.data.ramUsed - (this.data.hostname === "home" ? reservedHomeRam : 0)),
			trueMax: this.data.maxRam,
		};
	}
	get power() {
		return Math.max(0, Math.log2(this.data.maxRam));
	}
	get organization() {
		return this.data.organizationName;
	}
	get isHome() {
		return this.data.hostname === "home";
	}
	get ports() {
		return {
			required: this.data.numOpenPortsRequired ?? 0,
			open: this.data.openPortCount ?? 0,
			ftp: this.data.ftpPortOpen,
			http: this.data.httpPortOpen,
			smtp: this.data.smtpPortOpen,
			sql: this.data.sqlPortOpen,
			ssh: this.data.sshPortOpen,
		};
	}
	get security() {
		return {
			level: this.data.hackDifficulty ?? 0,
			min: this.data.minDifficulty ?? 0,
		};
	}
	get money() {
		return {
			available: this.data.moneyAvailable ?? 1,
			max: this.data.moneyMax ?? 0,
			growth: this.data.serverGrowth ?? 0,
		};
	}

	threadCount(scriptRam: number) {
		const threads = this.ram.free / scriptRam;
		return Math.floor(threads);
	}
	get isTarget() {
		return !this.purchased && !this.isHome && this.money.max > 0 && this.ports.open >= this.ports.required && this.admin && this.level <= this.ns.getPlayer().skills.hacking;
	}
	get isAttacker() {
		return this.purchased || this.isHome || (this.ram.max > 0 && this.admin);
	}
	get needsPrep() {
		return this.isTarget && (this.security.level > this.security.min || this.money.available < this.money.max);
	}
	get pids() {
		return this.ns.ps(this.id);
	}
	get targeting_pids() {
		const pids = [];
		for (const server of getServerList(this.ns)) {
			const ps = this.ns.ps(server);
			for (const process of ps) {
				if (process.args.length > 0 && process.args[0] === this.id) {
					pids.push(process);
				}
			}
		}
		return pids;
	}

	sudo = () => {
		try {
			this.ns.brutessh(this.id);
			this.ns.ftpcrack(this.id);
			this.ns.relaysmtp(this.id);
			this.ns.httpworm(this.id);
			this.ns.sqlinject(this.id);
		} catch {}

		try {
			this.ns.nuke(this.id);
		} catch {}
	};
}
