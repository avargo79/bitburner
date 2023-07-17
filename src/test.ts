import { NS } from "@ns";
export { autocomplete } from "./utils.js";

export async function main(ns: NS): Promise<void> {
	while (true) {
		if (ns.gang.canRecruitMember()) recruit(ns);

		await ns.sleep(1000);
	}
}

async function recruit(ns: NS) {
	const members = ns.gang.getMemberNames();
	const name = `Thug${members.length + 1}`;
	ns.gang.recruitMember(name);
	ns.gang.setMemberTask(name, "Train Combat");
}
