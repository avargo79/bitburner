import { NS } from "@ns";
import { getServerList, printLog } from "./utils.js";
import BaseServer from "./server.js";

export { autocomplete } from "./utils.js";
const attack_script = "bin.wgh.js";

export async function main(ns: NS): Promise<void> {
	const data = ns.flags([
		["tail", false],
		["target", ""],
	]);

	ns.disableLog("ALL");
	ns.clearLog();
	if (data["tail"]) ns.tail();

	const hostname = data["target"] as string;
	if (!hostname) {
		ns.tprint("Target not found... Exiting");
		return;
	}
	const target = new BaseServer(ns, hostname);

	const servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	ns.atExit(() => killScripts(ns, attack_script, servers));
	const scriptRam = ns.getScriptRam(attack_script);
	while (true) {
		servers.forEach((s) => ns.scp([attack_script], s.id, "home"));
		servers.filter((s) => !s.admin).forEach((s) => s.sudo());
		const attackers = servers.filter((s) => s.isAttacker);

		if (target.security.level > target.security.min + 2) {
			weakenTarget(ns, target, attackers, scriptRam);
		} else if (target.money.available < target.money.max * 0.8) {
			growTarget(ns, target, attackers, scriptRam);
		} else {
			hackTarget(ns, target, attackers, scriptRam);
		}

		ns.clearLog();
		printLog(ns, target);
		await ns.sleep(10);
	}
}

function weakenTarget(ns: NS, target: BaseServer, attackers: BaseServer[], scriptRam: number) {
	for (const attacker of attackers) {
		const threads = attacker.threadCount(scriptRam);
		if (threads > 0) {
			ns.exec(attack_script, attacker.id, threads, target.id, "w", performance.now() + 20);
		}
	}
}

function growTarget(ns: NS, target: BaseServer, attackers: BaseServer[], scriptRam: number) {
	for (const attacker of attackers) {
		const threads = attacker.threadCount(scriptRam);
		if (threads > 0) {
			ns.exec(attack_script, attacker.id, threads, target.id, "g", performance.now() + 40);
		}
	}
}

function hackTarget(ns: NS, target: BaseServer, attackers: BaseServer[], scriptRam: number) {
	for (const attacker of attackers) {
		const threads = attacker.threadCount(scriptRam);
		if (threads > 0) {
			ns.exec(attack_script, attacker.id, threads, target.id, "h", performance.now() + 60);
		}
	}
}

function killScripts(ns: NS, scriptName: string, servers: BaseServer[]) {
	servers.forEach((s) => ns.scriptKill(scriptName, s.id));
}
