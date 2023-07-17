import { NS } from "@ns";
import BaseServer from "./server";

export function getServerList(ns: NS, current = "home", set = new Set<string>()): string[] {
	const connections = ns.scan(current);
	const next = connections.filter((c) => !set.has(c));
	next.forEach((n) => {
		set.add(n);
		return getServerList(ns, n, set);
	});
	return Array.from(set.keys());
}

export function range(size: number, startAt = 0) {
	return [...Array(size).keys()].map((i) => i + startAt);
}

export function formatMoney(val: number): string {
	return val.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export function autocomplete(data: { servers: any }, args: any) {
	return data.servers;
}

export function scriptsRunning(ns: NS, servers: BaseServer[], scriptName: string): number {
	return servers.reduce<number>((acc, s) => (acc += getAttackThreads(s, scriptName)), 0);

	function getAttackThreads(s: BaseServer, scriptName: string) {
		return s.pids.reduce<number>((acc, ps) => (acc += ps.filename == scriptName ? 1 : 0), 0);
	}
}

// export function printLog(ns: NS, server: BaseServer, extra = "") {
// 	let money = ns.getServerMoneyAvailable(server.id);
// 	if (money === 0) money = 1;
// 	const maxMoney = ns.getServerMaxMoney(server.id);
// 	const minSec = ns.getServerMinSecurityLevel(server.id);
// 	const sec = ns.getServerSecurityLevel(server.id);

// 	ns.print(` ${server.id}: ${extra}`);
// 	ns.print(` $_______: ${formatMoney(money)} / ${formatMoney(maxMoney)} (${((money / maxMoney) * 100).toFixed(2)}%)`);
// 	ns.print(` security: +${(sec - minSec).toFixed(2)}`);
// 	ns.print(` hack____: ${ns.tFormat(ns.getHackTime(server.id))} (t=${Math.ceil(ns.hackAnalyzeThreads(server.id, money))})`);
// 	ns.print(` grow____: ${ns.tFormat(ns.getGrowTime(server.id))} (t=${Math.ceil(ns.growthAnalyze(server.id, maxMoney / money))})`);
// 	ns.print(` weaken__: ${ns.tFormat(ns.getWeakenTime(server.id))} (t=${Math.ceil((sec - minSec) * 20)})`);
// }

export function printLog(ns: NS, server: BaseServer, extra = "") {
	let money = server.money.available; // ns.getServerMoneyAvailable(server.id);
	if (money === 0) money = 1;
	const maxMoney = server.money.max; // ns.getServerMaxMoney(server.id);
	const minSec = server.security.min; // ns.getServerMinSecurityLevel(server.id);
	const sec = server.security.level; // ns.getServerSecurityLevel(server.id);

	ns.print(` ${server.id}: ${extra}`);
	ns.print(` $_______: ${formatMoney(money)} / ${formatMoney(maxMoney)} (${((money / maxMoney) * 100).toFixed(2)}%)`);
	ns.print(` security: +${(sec - minSec).toFixed(2)}`);
	ns.print(` hack____: ${ns.tFormat(ns.getHackTime(server.id))} (t=${Math.ceil(ns.hackAnalyzeThreads(server.id, money))})`);
	ns.print(` grow____: ${ns.tFormat(ns.getGrowTime(server.id))} (t=${Math.ceil(ns.growthAnalyze(server.id, maxMoney / money))})`);
	ns.print(` weaken__: ${ns.tFormat(ns.getWeakenTime(server.id))} (t=${Math.ceil((sec - minSec) * 20)})`);
}
