import { NS } from "@ns";
import { getServerList, scriptsRunning } from "./utils.js";
import BaseServer from "./server.js";

export { autocomplete } from "utils.js";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");

	const attack_script = "bin.wgh.js";
	const scriptRam = ns.getScriptRam(attack_script);

	const servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	servers.forEach((s) => ns.scp([attack_script], s.id, "home"));
	servers.filter((s) => !s.admin).forEach((s) => s.sudo());

	const attackers = servers.filter((s) => s.isAttacker);
	attackers.sort((a, b) => b.ram.free - a.ram.free);
	let targets = servers.filter((s) => s.isTarget && s.needsPrep);
	targets.sort((a, b) => a.level - b.level);

	if (ns.args[0]) {
		targets = targets.filter((s) => s.hostname == ns.args[0]);
	}

	do {
		for (const target of targets) {
			const money = target.money.available || 1;
			const maxMoney = target.money.max;

			const wk1Threads = Math.ceil((target.security.level - target.security.min) * 20);
			const grThreads = Math.ceil(ns.growthAnalyze(target.id, maxMoney / money));
			const wk2Threads = Math.ceil(grThreads / 12.5);

			const land_time = Math.ceil(performance.now() + ns.getWeakenTime(target.id) + 200);
			if (wk1Threads > 0) {
				await tryWeakenTarget(ns, target, wk1Threads, attackers, scriptRam, attack_script, land_time);
			}

			if (grThreads > 0) {
				await tryGrowTarget(ns, target, grThreads, attackers, scriptRam, attack_script, land_time);
			}

			if (wk2Threads > 0) {
				await tryWeakenTarget(ns, target, wk2Threads, attackers, scriptRam, attack_script, land_time);
			}

			await ns.sleep(20);
		}

		do {
			ns.clearLog();
			ns.print("Running scripts: ", scriptsRunning(ns, attackers, attack_script));
			await ns.sleep(10);
		} while (scriptsRunning(ns, attackers, attack_script) > 0);

		await ns.sleep(20);
	} while (servers.some((s) => s.isTarget && s.needsPrep));
}

async function tryWeakenTarget(ns: NS, target: BaseServer, wk1Threads: number, attackers: BaseServer[], scriptRam: number, attack_script: string, land_time: number) {
	const wkTime = land_time - Math.ceil(ns.getWeakenTime(target.id));
	for (const attacker of attackers) {
		let threads = attacker.threadCount(scriptRam);
		if (threads == 0) continue;

		if (threads > wk1Threads) threads = wk1Threads;
		ns.exec(attack_script, attacker.id, threads, target.id, "w", wkTime + 20);
		wk1Threads -= threads;

		if (wk1Threads == 0) break;
		await ns.sleep(20);
	}
}

async function tryGrowTarget(ns: NS, target: BaseServer, grThreads: number, attackers: BaseServer[], scriptRam: number, attack_script: string, land_time: number) {
	const grTime = land_time - Math.ceil(ns.getGrowTime(target.id));
	for (const attacker of attackers) {
		let threads = attacker.threadCount(scriptRam);
		if (threads == 0) continue;

		if (threads > grThreads) threads = grThreads;
		ns.exec(attack_script, attacker.id, threads, target.id, "g", grTime + 40);
		grThreads -= threads;

		if (grThreads == 0) break;
		await ns.sleep(20);
	}
}
