import { NS } from "@ns";
import { getServerList } from "./utils.js";
import BaseServer from "./server.js";

export async function main(ns: NS): Promise<void> {
	const scriptName = "bin.loop.js";
	const scriptRam = ns.getScriptRam(scriptName);

	const target = ns.args[0] as string;

	const servers = getServerList(ns).map((s) => new BaseServer(ns, s));
	const attackers = servers.filter((s) => s.isAttacker && s.threadCount(scriptRam) > 0);

	for (const server of attackers) {
		ns.scp(scriptName, server.id, "home");
		ns.exec(scriptName, server.id, server.threadCount(scriptRam), target);
	}
}
