import { NS } from "@ns";
import PrettyTable from "./prettytable";
import { formatMoney, getServerList } from "./utils";
import BaseServer from "./server";

/** @param {NS} ns **/
export async function main(ns: NS) {
	ns.disableLog("ALL");
	ns.clearLog();

	const servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	servers.filter((s) => !s.admin).forEach((s) => s.sudo());
}
