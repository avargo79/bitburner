import { NS } from "../NetscriptDefinitions";
import BaseServer from "./server";

export class Strategy {
	public Target: BaseServer;

	public WeakThreads1 = 0;
	public GrowThreads = 0;
	public WeakThreads2 = 0;
	public HackThreads = 0;

	public get TotalThreads(): number {
		return this.WeakThreads1 + this.GrowThreads + this.WeakThreads2 + this.HackThreads;
	}
	public get RemainingThreads(): number {
		const used_threads = this.Attacks.map((a) => a.threads).reduce((acc, threads) => (acc += threads), 0);
		return this.TotalThreads - used_threads;
	}
	public LandTime!: number;
	public Attacks: Attack[] = [];

	constructor(ns: NS, target: BaseServer) {
		this.Target = target;
		this.HackThreads = Math.ceil(ns.hackAnalyzeThreads(target.id, target.money.max));
		if (this.HackThreads == Infinity) this.HackThreads = 1;

		if (target.security.level > target.security.min) {
			this.WeakThreads1 = Math.ceil((target.security.level - target.security.min) * 20);
		} else {
			this.WeakThreads1 = Math.ceil(ns.hackAnalyzeSecurity(this.HackThreads, target.id)) + 10;
		}
		if (this.WeakThreads1 == Infinity) this.WeakThreads1 = 1;

		if (target.money.available == target.money.max && target.security.level == target.security.min) {
			this.GrowThreads = Math.ceil(ns.growthAnalyze(target.id, target.money.max));
		} else {
			let money = target.money.max / target.money.available;
			if (money == Infinity) money = target.money.max;
			this.GrowThreads = Math.ceil(ns.growthAnalyze(target.id, money));
		}
		if (this.GrowThreads == Infinity) this.GrowThreads = 1;

		this.WeakThreads2 = Math.ceil(this.GrowThreads / 12.5) + 15;
		if (this.WeakThreads2 == Infinity) this.WeakThreads2 = 1;
	}
}

export interface Attack {
	id: string;
	type: string;
	threads: number;
}
