import { NS } from "@ns";
import { getServerList } from "./utils.js";
import BaseServer from "./server.js";

export async function main(ns: NS): Promise<void> {
	const scriptName = "bin.share.js";
	ns.disableLog("ALL");
	const scriptRam = ns.getScriptRam(scriptName);

	const servers = getServerList(ns)
		.map((s) => new BaseServer(ns, s))
		.filter((s) => s.admin && s.threadCount(scriptRam) > 0);

	ns.atExit(() => killScripts(ns, scriptName, servers));

	for (const server of servers) {
		ns.scp(scriptName, server.id, "home");
		ns.exec(scriptName, server.id, server.threadCount(scriptRam));
	}

	ns.tail();
	while (true) {
		ns.clearLog();
		ns.print("Current Share Power: ", ns.getSharePower());
		await ns.sleep(200);
	}
}

function killScripts(ns: NS, scriptName: string, servers: BaseServer[]) {
	servers.forEach((s) => ns.scriptKill(scriptName, s.id));
}
