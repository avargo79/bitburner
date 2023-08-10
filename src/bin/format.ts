import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	const hostname = <string>ns.args[0] ?? "home";
	const files = ns.ls(hostname, ".js").concat(ns.ls(hostname, ".dat"));
	files.forEach((fileName) => ns.rm(fileName, hostname));
}
