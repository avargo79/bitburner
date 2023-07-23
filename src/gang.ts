import { Gang, NS } from "@ns";

const factionName = "Slum Snakes";

const TASK_XREF: TaskInfo[] = [
	{ taskName: "Mug People", maxMembers: 5, minStats: 25, minAscend: 1, chanceToWinClash: 0 },
	{ taskName: "Terrorism", maxMembers: 9, minStats: 100, minAscend: 4, chanceToWinClash: 0 },
	{ taskName: "Terrorism", maxMembers: 11, minStats: 100, minAscend: 16, chanceToWinClash: 0 },
	{ taskName: "Human Trafficking", maxMembers: 12, minStats: 100, minAscend: 16, chanceToWinClash: 0 },
];
const TASK_WARFARE: TaskInfo = { taskName: "Territory Warfare", maxMembers: 12, minStats: 100, minAscend: 16, chanceToWinClash: 0.9 }; // based on chance to win

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");
	const gang = ns.gang;
	const myGang = new PlayerGang(ns);

	if (!gang.inGang() && !myGang.createGang(factionName)) {
		ns.tprint("Could not create a gang!");
		ns.exit();
	}

	TASK_XREF.sort((a, b) => a.maxMembers - b.maxMembers);
	let chanceToWinClash = 1;
	while (true) {
		ns.clearLog();

		if (myGang.canRecruit) {
			recruit(gang);
		}
		const members = myGang.members;
		const task = <TaskInfo>TASK_XREF.find((t) => members.length <= t.maxMembers);
		ns.print("Selected: ", task.taskName, ": ", task.maxMembers, " - ", members.length);

		members.forEach((member, i) => {
			tryAscend(ns, gang, member);

			if (i % 2 == 1 && myGang.wantedPenalty < 0.95 && myGang.wantedLevel > 1000) {
				ns.gang.setMemberTask(member.name, "Vigilante Justice");
			} else if (member.isAscend(TASK_WARFARE.minAscend) && member.canDoTask(TASK_WARFARE) && chanceToWinClash <= 0.9) {
				if (member.data.task !== TASK_WARFARE.taskName) gang.setMemberTask(member.name, TASK_WARFARE.taskName);
			} else if (member.isAscend(task.minAscend) && member.canDoTask(task, chanceToWinClash)) {
				if (member.data.task !== task.taskName) gang.setMemberTask(member.name, task.taskName);
			} else {
				if (member.data.task !== "Train Combat") gang.setMemberTask(member.name, "Train Combat");
			}
		});

		chanceToWinClash = tryTerritoryWar(ns);
		await ns.sleep(1000);
	}
}

async function recruit(gang: Gang) {
	const members = gang.getMemberNames();
	const name = `Thug${Math.floor(Math.random() * 100 + members.length)}`;
	gang.recruitMember(name);
	gang.setMemberTask(name, "Train Combat");
}

function tryAscend(ns: NS, gang: Gang, member: PlayerGangMember) {
	const asc = ns.gang.getAscensionResult(member.name);
	if (!asc) return;

	const memberNames = gang.getMemberNames();

	try {
		const stats = ns.gang.getMemberInformation(member.name);
		const result = Math.max(asc.cha, asc.def, asc.dex, asc.hack, asc.str);
		const highest = Math.max(stats.cha_asc_mult, stats.def_asc_mult, stats.dex_asc_mult, stats.hack_asc_mult, stats.str_asc_mult);

		if (result >= 1.2 && (memberNames.length < 10 || memberNames.length == 12)) {
			ns.gang.ascendMember(member.name);
		} else if (result >= 2) {
			ns.gang.ascendMember(member.name);
		}
		if (highest < 16) {
			if (stats.agi_asc_mult * asc.agi > 16) {
				ns.gang.ascendMember(member.name);
			}
			if (stats.dex_asc_mult * asc.dex > 16) {
				ns.gang.ascendMember(member.name);
			}
			if (stats.def_asc_mult * asc.def > 16) {
				ns.gang.ascendMember(member.name);
			}
			if (stats.cha_asc_mult * asc.cha > 16) {
				ns.gang.ascendMember(member.name);
			}
			if (stats.str_asc_mult * asc.str > 16) {
				ns.gang.ascendMember(member.name);
			}
			if (stats.hack_asc_mult * asc.hack > 16) {
				ns.gang.ascendMember(member.name);
			}
		}
	} catch {}
}

function tryTerritoryWar(ns: NS) {
	const otherGangsInfo = ns.gang.getOtherGangInformation();
	const otherGangNames = Object.keys(otherGangsInfo);
	const otherGangData = Object.values(otherGangsInfo);
	const otherGangs = otherGangNames.map((gangName, index) => ({ name: gangName, ...otherGangData[index] }));

	let min = 1;
	for (const otherGang of otherGangs) {
		const chanceToWin = ns.gang.getChanceToWinClash(otherGang.name);
		if (ns.gang.getGangInformation().power == otherGang.power) {
		} else if (chanceToWin < min && otherGang.territory > 0) {
			min = chanceToWin;
		}
	}

	if (ns.gang.getGangInformation().territory < 1) {
		ns.print("territory: " + (100 * ns.gang.getGangInformation().territory).toFixed(2) + "%");
		ns.print("win chance: " + (100 * min).toFixed(5) + "%");
		if (min > 0.51) {
			ns.gang.setTerritoryWarfare(true);
		} else if (ns.gang.getGangInformation().territoryWarfareEngaged) {
			ns.gang.setTerritoryWarfare(false);
		}
	}

	return min;
}

interface OtherGang {
	name: string;
	power: number;
	territory: number;
}

class PlayerGang {
	constructor(private ns: NS) {}

	get data() {
		return this.ns.gang.getGangInformation();
	}

	get canRecruit() {
		return this.ns.gang.canRecruitMember();
	}

	get wantedLevel() {
		return this.data.wantedLevel;
	}

	get wantedPenalty() {
		return this.data.wantedPenalty;
	}

	get power(): number {
		return this.data.power;
	}

	get territory(): number {
		return this.data.territory;
	}

	get members(): PlayerGangMember[] {
		return this.ns.gang.getMemberNames().map((name) => new PlayerGangMember(this.ns, name));
	}

	get otherGangs(): OtherGang[] {
		const otherGangsInfo = this.ns.gang.getOtherGangInformation();
		const otherGangNames = Object.keys(otherGangsInfo);
		const otherGangData = Object.values(otherGangsInfo);
		return otherGangNames.map((gangName, index) => ({ name: gangName, ...otherGangData[index] }));
	}

	createGang(factionName: string) {
		return this.ns.gang.createGang(factionName);
	}

	getAscensionResult(memberName: string) {
		return this.ns.gang.getAscensionResult(memberName);
	}

	ascendMember(memberName: string) {
		this.ns.gang.ascendMember(memberName);
	}

	getChanceToWinClash(gangName: string): number {
		return this.ns.gang.getChanceToWinClash(gangName);
	}

	setTerritoryWarfare(engage: boolean) {
		if (this.data.territoryWarfareEngaged !== engage) this.ns.gang.setTerritoryWarfare(engage);
	}
}

class PlayerGangMember {
	constructor(private ns: NS, public name: string) {}

	get data() {
		return this.ns.gang.getMemberInformation(this.name);
	}

	get stats() {
		return {
			str: {
				level: this.data.str,
				asc_mult: this.data.str_asc_mult,
				mult: this.data.str_mult,
			},
			agi: {
				level: this.data.agi,
				asc_mult: this.data.agi_asc_mult,
				mult: this.data.agi_mult,
			},
			dex: {
				level: this.data.dex,
				asc_mult: this.data.dex_asc_mult,
				mult: this.data.dex_mult,
			},
			def: {
				level: this.data.def,
				asc_mult: this.data.def_asc_mult,
				mult: this.data.def_mult,
			},
			cha: {
				level: this.data.cha,
				asc_mult: this.data.cha_asc_mult,
				mult: this.data.cha_mult,
			},
			hack: {
				level: this.data.hack,
				asc_mult: this.data.hack_asc_mult,
				mult: this.data.hack_mult,
			},
		};
	}

	canDoTask(task: TaskInfo, chanceToWinClash = 1) {
		if (this.stats.agi.level < this.stats.agi.asc_mult * this.stats.agi.mult * task.minStats) return false;
		if (this.stats.def.level < this.stats.def.asc_mult * this.stats.def.mult * task.minStats) return false;
		if (this.stats.dex.level < this.stats.dex.asc_mult * this.stats.dex.mult * task.minStats) return false;
		if (this.stats.str.level < this.stats.str.asc_mult * this.stats.str.mult * task.minStats) return false;

		return true;
	}

	isAscend(goal: number) {
		return Math.max(this.stats.agi.asc_mult, this.stats.cha.asc_mult, this.stats.def.asc_mult, this.stats.dex.asc_mult, this.stats.hack.asc_mult, this.stats.str.asc_mult) >= goal;
	}
}

class TaskInfo {
	public taskName!: string;
	public maxMembers!: number;
	public minStats!: number;
	public minAscend!: number;
	public chanceToWinClash!: number;
}
