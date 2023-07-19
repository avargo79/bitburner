import { NS } from "@ns";
import { formatMoney, getServerList, printLog, scriptsRunning } from "./utils.js";
import BaseServer from "./server.js";
import { Strategy } from "./strategy.js";
import PrettyTable from "./prettytable.js";

export { autocomplete } from "./utils.js";

const attack_script = "bin.wgh.js";

export async function main(ns: NS): Promise<void> {
	const data = ns.flags([
		["tail", false],
		["dry-run", false],
		["target", ""],
	]);

	ns.disableLog("ALL");
	ns.clearLog();

	if (data["dry-run"]) {
		printTargets(ns);
		ns.exit();
	}

	if (data["tail"]) ns.tail();

	const hostname = data["target"] as string;
	if (!hostname) {
		ns.tprint("Target not found... Exiting");
		return;
	}

	const scriptRam = ns.getScriptRam(attack_script);
	let servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	ns.atExit(() => killScripts(ns, attack_script, servers));

	const attacker_threads = new Map<string, number>();
	const target = new BaseServer(ns, hostname);

	while (true) {
		ns.clearLog();

		servers = getServerList(ns).map((s) => new BaseServer(ns, s));
		servers.filter((s) => !s.admin).forEach((s) => s.sudo());
		servers.forEach((s) => ns.scp([attack_script], s.id, "home"));

		const attackers = servers.filter((s) => s.isAttacker);
		attackers.forEach((s) => attacker_threads.set(s.id, s.threadCount(scriptRam)));

		ns.print("Preparing target...");
		await prepareTarget(target, ns, scriptRam, attackers, attacker_threads);

		const batches: Strategy[] = [];
		let batch_offset = 200;
		const strat: Strategy = new Strategy(ns, target);
		const total_attack_threads = strat.HackThreads + strat.WeakThreads1 + strat.GrowThreads + strat.WeakThreads2;
		const total_server_threads = attackers.reduce((acc, s) => (acc += s.threadCount(scriptRam)), 0);
		const total_batches = Math.floor(total_server_threads / total_attack_threads) || 1;

		ns.clearLog();
		const wkTime = ns.getWeakenTime(target.id);
		const last_attack = performance.now() + wkTime;
		for (let i = 0; i < total_batches; i++) {
			ns.clearLog();
			ns.print("Excuting batches... ", i + 1);
			const batch: Strategy = new Strategy(ns, target);
			batch.LandTime = last_attack + batch_offset;

			prepareStrategy(ns, batch, scriptRam, attackers, attacker_threads);
			executeStrategy(ns, batch, attack_script);
			batches.push(batch);
			await ns.sleep(1);
			batch_offset += 200;
		}

		ns.print("Waiting for batches to complete...");
		const last_land_time = batches.map((a) => a.LandTime).reduce((acc, land_time) => (acc = land_time > acc ? land_time : acc), 0);
		do {
			ns.clearLog();
			printLog(ns, target, "Executing - (" + batches.length + ") " + ns.tFormat(last_land_time - performance.now()));
			if (last_land_time - performance.now() < -5000) stopAttack(ns);
			await ns.sleep(10);
		} while (scriptsRunning(ns, attackers, attack_script) > 0);

		await ns.sleep(10);
	}
}

function stopAttack(ns: NS) {
	const servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	for (const server of servers) {
		ns.scriptKill(attack_script, server.id);
	}
}

async function prepareTarget(target: BaseServer, ns: NS, scriptRam: number, attackers: BaseServer[], attacker_threads: Map<string, number>) {
	while (target.security.level > target.security.min || target.money.available < target.money.max) {
		const strat = new Strategy(ns, target);
		strat.LandTime = performance.now() + ns.getWeakenTime(target.id);
		prepareStrategy(ns, strat, scriptRam, attackers, attacker_threads);
		strat.Attacks = strat.Attacks.filter((a) => a.type != "h");
		executeStrategy(ns, strat, attack_script);

		do {
			ns.clearLog();
			printLog(ns, target, "Preparing - " + ns.tFormat(strat.LandTime - performance.now()));
			await ns.sleep(10);
		} while (scriptsRunning(ns, attackers, attack_script) > 0);

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

	batch.Attacks.filter((a) => a.type == "h").forEach((a) => ns.exec(script, a.id, a.threads, batch.Target.id, "h", batch.LandTime - hkTime + 20));
	batch.Attacks.filter((a) => a.type == "w1").forEach((a) => ns.exec(script, a.id, a.threads, batch.Target.id, "w", batch.LandTime - wkTime + 40));
	batch.Attacks.filter((a) => a.type == "g").forEach((a) => ns.exec(script, a.id, a.threads, batch.Target.id, "g", batch.LandTime - grTime + 60));
	batch.Attacks.filter((a) => a.type == "w2").forEach((a) => ns.exec(script, a.id, a.threads, batch.Target.id, "w", batch.LandTime - wkTime + 80));
}

function killScripts(ns: NS, scriptName: string, servers: BaseServer[]) {
	servers.forEach((s) => ns.scriptKill(scriptName, s.id));
}

function printTargets(ns: NS) {
	const servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	servers.filter((s) => !s.admin).forEach((s) => s.sudo);
	const totalThreads = servers.filter((s) => s.isAttacker).reduce((acc, s) => (acc += s.threadCount(2)), 0);

	const targets = servers.filter((s) => s.isTarget);
	targets.sort((a, b) => b.money.max - a.money.max);
	const results = [];
	for (const target of targets) {
		const strat = new Strategy(ns, target);
		if (totalThreads >= strat.TotalThreads) {
			const numberOfBatches = Math.floor(totalThreads / strat.TotalThreads);
			const weakenSeconds = Math.ceil(ns.getWeakenTime(target.id) / 1000);
			const total_value = target.money.max * numberOfBatches;
			const batch_run_value = (total_value / weakenSeconds) * ns.hackAnalyzeChance(target.id);
			results.push({ server: target, batches: numberOfBatches, money: batch_run_value, total_money: formatMoney(target.money.max * numberOfBatches), hack_perc: ns.hackAnalyzeChance(target.id) });
		}
	}
	results.sort((a, b) => a.money - b.money);

	const pt = new PrettyTable();
	const headers = ["SERVERNAME", "LEVEL", "TOTAL_BATCHES", "TOTAL_GAIN", "POTENTIAL", "HACK%"];
	const rows = results.map((s) => [s.server.id, s.server.level, s.batches, s.total_money, formatMoney(s.money), (s.hack_perc * 100).toFixed(2) + "%"]);

	pt.create(headers, rows);

	ns.tprint(pt.print());
	ns.tprint("Total Reslts: ", servers.length);
}
