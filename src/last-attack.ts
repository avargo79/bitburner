import { NS } from "@ns";
import { getServerList } from "./utils";
import PrettyTable from "./prettytable";
import BaseServer from "./server";

const attack_script = "bin.wgh.js";

/** @param {NS} ns **/
export async function main(ns: NS) {
	ns.disableLog("ALL");
	const tailed = ns.args[0];
	if (tailed) ns.tail();

	do {
		ns.clearLog();
		const servers = getServerList(ns).map((s) => new BaseServer(ns, s));
		const pids = servers
			.map((s) => s.pids)
			.flat()
			.filter((pid) => pid.filename == attack_script);

		const targets = new Set<string>();

		const results = [];
		pids.forEach((pid) => targets.add(<string>pid.args[0]));
		for (const target of [...targets]) {
			const target_pids = pids.filter((pid) => pid.args[0] == target);
			const wk = target_pids.filter((pid) => pid.args[1] == "w").reduce<number>((acc, ps) => (acc += ps.threads), 0);
			const gr = target_pids.filter((pid) => pid.args[1] == "g").reduce<number>((acc, ps) => (acc += ps.threads), 0);
			const hk = target_pids.filter((pid) => pid.args[1] == "h").reduce<number>((acc, ps) => (acc += ps.threads), 0);
			const last = target_pids.reduce<number>((acc, ps) => (acc = <number>ps.args[2] > acc ? <number>ps.args[2] : acc), 0);
			const weakTime = ns.getWeakenTime(target);
			results.push({ id: target, wk, gr, hk, last: last + weakTime + 200 });
		}
		results.sort((a, b) => a.last - b.last);

		const pt = new PrettyTable();
		const headers = ["SERVERNAME", "WK", "GR", "HK", "TIME LEFT"];
		const rows = results.map((result) => [result.id, result.wk, result.gr, result.hk, ns.tFormat(result.last - performance.now())]);

		pt.create(headers, rows);
		if (tailed) {
			ns.print(pt.print());
		} else {
			ns.tprint(pt.print());
		}
		await ns.sleep(200);
	} while (tailed);
}
