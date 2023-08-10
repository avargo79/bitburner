import { NS } from "@ns";
import { getServerList } from "./utils";

export async function main(ns: NS): Promise<void> {
	const servers = getServerList(ns).map((s) => ns.getServer(s));
	ns.write("/data/server_list.txt", JSON.stringify(servers), "w");

	const player = ns.getPlayer();
	ns.write("/data/player.txt", JSON.stringify(player), "w");

	const crack_files = ns.ls("home", ".exe");
	ns.write("/data/cracks.txt", JSON.stringify(crack_files), "w");
}
