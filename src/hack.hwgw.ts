import { NS } from "@ns";
import { formatMoney, getServerList, printLog, scriptsRunning } from "./utils.js";
import BaseServer from "./server.js";
import { Strategy } from "./strategy.js";
import PrettyTable from "./prettytable.js";

export { autocomplete } from "./utils.js";

const ATTACK_SCRIPT = "bin.wgh.js";
const SCRIPTS_SERVER = "home";

// Extra time to wait for all attacks to finsih before killing
const TIME_TO_LIVE = -5000;

// Batch execution offsets
const BATCH_OFFSET = 160;
const HACK_OFFSET = 20;
const WEAK1_OFFSET = 40;
const GROW_OFFSET = 60;
const WEAK2_OFFSET = 80;

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");
	ns.clearLog();

	const data = ns.flags([
		["tail", false],
		["dry-run", false],
		["target", ""],
	]);

	const hostname = data["target"] as string;
	if (!hostname) {
		ns.tprint("Target not found... Exiting");
		return;
	}

	const scriptRam = ns.getScriptRam(ATTACK_SCRIPT);
	let servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	ns.atExit(() => stopAttack(ns));

	const attacker_threads = new Map<string, number>();
	const target = new BaseServer(ns, hostname);

	while (true) {
		ns.clearLog();

		servers = getServerList(ns).map((s) => new BaseServer(ns, s));
		servers.filter((s) => !s.admin).forEach((s) => s.sudo());
		servers.forEach((s) => ns.scp([ATTACK_SCRIPT], s.id, SCRIPTS_SERVER));

		const attackers = servers.filter((s) => s.isAttacker);
		attackers.forEach((s) => attacker_threads.set(s.id, s.threadCount(scriptRam)));

		await prepareTarget(target, ns, scriptRam, attackers, attacker_threads);

		const batches: Strategy[] = [];
		let offset = BATCH_OFFSET;
		const strat: Strategy = new Strategy(ns, target);
		const total_attack_threads = strat.HackThreads + strat.WeakThreads1 + strat.GrowThreads + strat.WeakThreads2;
		const total_server_threads = attackers.reduce((acc, s) => (acc += s.threadCount(scriptRam)), 0);
		const total_batches = Math.floor(total_server_threads / total_attack_threads) || 1;

		ns.clearLog();
		ns.print("Excuting batches... ", total_batches);
		const wkTime = ns.getWeakenTime(target.id);
		const last_attack = performance.now() + wkTime;
		for (let i = 0; i < total_batches; i++) {
			const batch: Strategy = new Strategy(ns, target);
			batch.LandTime = last_attack + offset;

			prepareStrategy(ns, batch, scriptRam, attackers, attacker_threads);
			executeStrategy(ns, batch, ATTACK_SCRIPT);
			batches.push(batch);
			offset += BATCH_OFFSET;
		}

		const last_land_time = batches.map((a) => a.LandTime).reduce((acc, land_time) => (acc = land_time > acc ? land_time : acc), 0);
		do {
			ns.clearLog();
			printLog(ns, target, "Executing - (" + batches.length + ") " + ns.tFormat(last_land_time - performance.now()));
			if (last_land_time - performance.now() < TIME_TO_LIVE) stopAttack(ns);
			await ns.sleep(10);
		} while (scriptsRunning(ns, attackers, ATTACK_SCRIPT) > 0);

		await ns.sleep(10);
	}
}

function stopAttack(ns: NS) {
	const servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	for (const server of servers) {
		ns.scriptKill(ATTACK_SCRIPT, server.id);
	}
}

async function prepareTarget(target: BaseServer, ns: NS, scriptRam: number, attackers: BaseServer[], attacker_threads: Map<string, number>) {
	while (target.security.level > target.security.min || target.money.available < target.money.max) {
		const strat = new Strategy(ns, target);
		strat.LandTime = performance.now() + ns.getWeakenTime(target.id);
		prepareStrategy(ns, strat, scriptRam, attackers, attacker_threads);
		strat.Attacks = strat.Attacks.filter((a) => a.type != "h");
		executeStrategy(ns, strat, ATTACK_SCRIPT);

		do {
			ns.clearLog();
			printLog(ns, target, "Preparing - " + ns.tFormat(strat.LandTime - performance.now()));
			await ns.sleep(10);
		} while (scriptsRunning(ns, attackers, ATTACK_SCRIPT) > 0);

		await ns.sleep(40);
		attackers.forEach((s) => attacker_threads.set(s.id, s.threadCount(scriptRam)));
	}
}

function prepareStrategy(ns: NS, batch: Strategy, scriptRam: number, servers: BaseServer[], attacker_threads: Map<string, number>) {
	const attackers = servers.filter((s) => s.isAttacker && s.threadCount(scriptRam) >= 1);
	attackers.sort((a, b) => b.ram.free - a.ram.free);

	let wk1_threads = batch.WeakThreads1;
	let gr_threads = batch.GrowThreads;
	let wk2_threads = batch.WeakThreads2;
	let hk_threads = batch.HackThreads;

	for (const attacker of attackers) {
		let avail_threads = attacker_threads.get(attacker.id) || 0;
		if (avail_threads < 1) continue;

		if (avail_threads > 0 && hk_threads > 0) {
			const threads = avail_threads > hk_threads ? hk_threads : avail_threads;
			hk_threads -= threads;
			avail_threads -= threads;
			batch.Attacks.push({ id: attacker.id, type: "h", threads: threads });
		}

		if (avail_threads > 0 && wk1_threads > 0) {
			const threads = avail_threads > wk1_threads ? wk1_threads : avail_threads;
			wk1_threads -= threads;
			avail_threads -= threads;
			batch.Attacks.push({ id: attacker.id, type: "w1", threads: threads });
		}

		if (avail_threads > 0 && gr_threads > 0) {
			const threads = avail_threads > gr_threads ? gr_threads : avail_threads;
			gr_threads -= threads;
			avail_threads -= threads;
			batch.Attacks.push({ id: attacker.id, type: "g", threads: threads });
		}

		if (avail_threads > 0 && wk2_threads > 0) {
			const threads = avail_threads > wk2_threads ? wk2_threads : avail_threads;
			wk2_threads -= threads;
			avail_threads -= threads;
			batch.Attacks.push({ id: attacker.id, type: "w2", threads: threads });
		}

		attacker_threads.set(attacker.id, avail_threads);
		const remaining_threads = hk_threads + wk1_threads + gr_threads + wk2_threads;
		if (remaining_threads == 0) break;
	}
}

function executeStrategy(ns: NS, batch: Strategy, script: string) {
	const wkTime = Math.ceil(ns.getWeakenTime(batch.Target.id));
	const grTime = Math.ceil(ns.getGrowTime(batch.Target.id));
	const hkTime = Math.ceil(ns.getHackTime(batch.Target.id));

	batch.Attacks.filter((a) => a.type == "h").forEach((a) => ns.exec(script, a.id, a.threads, batch.Target.id, "h", batch.LandTime - hkTime + HACK_OFFSET));
	batch.Attacks.filter((a) => a.type == "w1").forEach((a) => ns.exec(script, a.id, a.threads, batch.Target.id, "w", batch.LandTime - wkTime + WEAK1_OFFSET));
	batch.Attacks.filter((a) => a.type == "g").forEach((a) => ns.exec(script, a.id, a.threads, batch.Target.id, "g", batch.LandTime - grTime + GROW_OFFSET));
	batch.Attacks.filter((a) => a.type == "w2").forEach((a) => ns.exec(script, a.id, a.threads, batch.Target.id, "w", batch.LandTime - wkTime + WEAK2_OFFSET));
}
