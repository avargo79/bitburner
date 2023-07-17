import { NS } from "@ns";
export { autocomplete } from "./utils";

function recursiveScan(ns: NS, parent: string, server: string, target: string, route: string[]) {
	const children = ns.scan(server);
	for (const child of children) {
		if (parent == child) {
			continue;
		}
		if (child == target) {
			route.unshift(child);
			route.unshift(server);
			return true;
		}

		if (recursiveScan(ns, server, child, target, route)) {
			route.unshift(server);
			return true;
		}
	}
	return false;
}

export async function main(ns: NS) {
	const args = ns.flags([["help", false]]);
	const route: string[] = [];
	const server = ns.args[0] as string;
	if (!server || args.help) {
		ns.tprint("This script helps you find a server on the network and shows you the path to get to it.");
		ns.tprint(`Usage: run ${ns.getScriptName()} SERVER`);
		ns.tprint("Example:");
		ns.tprint(`> run ${ns.getScriptName()} n00dles`);
		return;
	}

	recursiveScan(ns, "", "home", server, route);

	const cmd = "connect " + route.join("; connect ") + "; backdoor";
	navigator.clipboard.writeText(cmd);
	ns.tprint("Route was added to the clipboard.");
}
