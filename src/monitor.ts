import { NS } from "@ns";
export { autocomplete } from "./utils";

function formatMoney(val: number): string {
	return val.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
export async function main(ns: NS) {
	const flags = ns.flags([
		["refreshrate", 200],
		["help", false],
	]);

	if (flags.help) {
		ns.tprint("This script helps visualize the money and security of a server.");
		ns.tprint(`USAGE: run ${ns.getScriptName()} SERVER_NAME`);
		ns.tprint("Example:");
		ns.tprint(`> run ${ns.getScriptName()} n00dles`);
		return;
	}

	ns.tail();
	ns.disableLog("ALL");
	while (true) {
		const server = ns.args[0] as string;
		let money = ns.getServerMoneyAvailable(server);
		if (money === 0) money = 1;
		const maxMoney = ns.getServerMaxMoney(server);
		const minSec = ns.getServerMinSecurityLevel(server);
		const sec = ns.getServerSecurityLevel(server);
		const xxx = getNewGrow(ns, server);
		ns.clearLog();
		ns.print(`${server}:`);
		ns.print(` $_______: ${formatMoney(money)} / ${formatMoney(maxMoney)} (${((money / maxMoney) * 100).toFixed(2)}%)`);
		ns.print(` security: +${(sec - minSec).toFixed(2)}`);
		ns.print(` hack____: ${ns.tFormat(ns.getHackTime(server))} (t=${Math.ceil(ns.hackAnalyzeThreads(server, money))})`);
		ns.print(` grow____: ${ns.tFormat(ns.getGrowTime(server))} (t=${Math.ceil(ns.growthAnalyze(server, maxMoney / money))}) est: ${xxx}`);
		ns.print(` weaken__: ${ns.tFormat(ns.getWeakenTime(server))} (t=${Math.ceil((sec - minSec) * 20)})`);
		await ns.sleep(200);
	}
}

function getNewGrow(ns: NS, target: string) {
	const hackmult = 2.688;
	const growmult = 1.7708;

	//Bitnode Multiplier Constants, update after changing Bitnodes
	const bitnodehackmult = 1.0;
	const bitnodegrowmult = 1.0;

	//Gather Hack-related Variables
	const skill = ns.getHackingLevel();
	const reqHack = ns.getServerRequiredHackingLevel(target);
	const minsecurity = Math.max(ns.getServerBaseSecurityLevel(target), 1);

	//Calculate number of Hack Threads Required
	const perhack = (((100 - minsecurity) * ((skill - reqHack + 1) / skill)) / 24000) * hackmult * bitnodehackmult;
	const hacks = Math.ceil(1 / perhack);

	//Gather Growth-related Variables
	const growth = ns.getServerGrowth(target);
	const security = minsecurity + hacks * 0.002;
	const maxmoney = ns.getServerMaxMoney(target);

	//Calculate number of Grow Threads Required
	const growpercent = Math.min(1 + 0.03 / security, 1.0035);
	const pergrow = Math.pow(growpercent, (growth / 100) * growmult * bitnodegrowmult);
	const var1 = maxmoney * Math.log(pergrow);
	const lambert = Math.log(var1) - Math.log(Math.log(var1)) - Math.log(1 - Math.log(Math.log(var1)) / Math.log(var1));
	return Math.ceil(lambert / Math.log(pergrow));
}
