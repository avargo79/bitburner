import { NS } from "@ns";
import PrettyTable from "./prettytable";
import { formatMoney, getServerList } from "./utils";
import BaseServer from "./server";

/** @param {NS} ns **/
export async function main(ns: NS) {
	const data = ns.flags([
		["value", false],
		["money", false],
		["weaken-time", false],
		["level", true],
		["all", false],
		["reverse", false],
		["purchased", false],
		["targets", false],
		["prep", false],
	]);

	let servers = getServerList(ns).map((s) => new BaseServer(ns, s));

	if (!data["all"]) {
		const hacking_level = ns.getHackingLevel();
		servers = servers.filter((s) => hacking_level >= s.level);
	}

	if (data["purchased"]) {
		servers = servers.filter((s) => s.purchased || s.id == "home");
	} else if (data["targets"]) {
		servers = servers.filter((s) => s.isTarget);
	} else if (data["prep"]) {
		servers = servers.filter((s) => s.isTarget && (s.security.level > s.security.min || s.money.available < s.money.max));
	}

	if (data["value"]) {
		servers.sort((a, b) => Math.floor(a.money.max / ns.getWeakenTime(a.id)) - Math.floor(b.money.max / ns.getWeakenTime(b.id)));
	} else if (data["money"]) {
		servers.sort((a, b) => a.money.max - b.money.max);
	} else if (data["level"]) {
		servers.sort((a, b) => a.level - b.level);
	} else if (data["weaken-time"]) {
		servers.sort((a, b) => ns.getWeakenTime(a.id) - ns.getWeakenTime(b.id));
	}

	if (data["reverse"]) {
		servers.reverse();
	}

	const pt = new PrettyTable();
	const headers = ["SERVERNAME", "LEVEL", "HACKED", "CASH%", "SEC+", "POWER", "WK", "$", "V"];
	const rows = servers.map((s) => [
		s.id,
		s.level,
		s.admin ? (s.backdoored ? "\u0138it" : "\u01a6oot") : s.ports.required,
		ns.nFormat(s.money.available / s.money.max || 0, "0%"),
		ns.nFormat(s.isTarget ? s.security.level - s.security.min : 0, "0.0"),
		s.power || "",
		ns.tFormat(ns.getWeakenTime(s.id)) || "",
		formatMoney(ns.getServerMaxMoney(s.id)),
		Math.floor(ns.getServerMaxMoney(s.id) / ns.getWeakenTime(s.id)),
	]);

	pt.create(headers, rows);

	ns.tprint(pt.print());
	ns.tprint("Total Reslts: ", servers.length);
}
