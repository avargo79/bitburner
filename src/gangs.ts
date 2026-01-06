import { Gang, NS } from "@ns";

/**
 * Check if gangs script can run
 * Requires SF2 (Rise of the Underworld) or currently in BN2
 * Also requires sufficient karma (<-54000)
 */
/**
 * Check if gang script prerequisites are met
 * @param {NS} ns - Netscript API
 * @returns {{ready: boolean, reason?: string}} Prerequisite check result
 */
export function checkPrerequisites(ns: NS): { ready: boolean; reason?: string } {
    const player = ns.getPlayer();
    const resetInfo = ns.getResetInfo();
    const currentBN = resetInfo.currentNode;
    const sourceFiles = ns.singularity.getOwnedSourceFiles();
    const sf2Level = sourceFiles.find((sf: any) => sf.n === 2)?.lvl ?? 0;
    
    // Check if gang API available
    if (!ns.gang) {
        if (currentBN !== 2 && sf2Level === 0) {
            return { ready: false, reason: "Gang API unavailable (need SF2 or BN2)" };
        }
        return { ready: false, reason: "Gang API unavailable" };
    }
    
    // Check if already in a gang
    try {
        if (ns.gang.inGang()) {
            return { ready: true };
        }
    } catch {
        return { ready: false, reason: "Gang API error" };
    }
    
    // Check karma requirement for gang creation
    if (player.karma > -54000) {
        return { ready: false, reason: `Insufficient karma for gang (need -54000, have ${Math.floor(player.karma)})` };
    }
    
    return { ready: true };
}

const factionName = "Slum Snakes";

// Configuration constants
const CONFIG = {
    TERRITORY: {
        EQUIPMENT_THRESHOLD: 0.89,
        MIN_WIN_CHANCE: 0.51,
        COMPLETE_CONTROL: 1.0,
    },
    WANTED: {
        PENALTY_THRESHOLD: 0.95,
        LEVEL_THRESHOLD: 1000,
    },
    ASCENSION: {
        MIN_GAIN: 1.2,
        FORCE_GAIN: 2.0,
        TARGET_MULTIPLIER: 16,
        MIN_MEMBERS_FOR_EARLY_ASCEND: 10,
        MAX_GANG_SIZE: 12,
    },
    VIGILANTE_RATIO: 0.5, // Every other member (50%)
} as const;

const TASK_XREF: TaskInfo[] = [
    {
        taskName: "Mug People",
        maxMembers: 5,
        minStats: 25,
        minAscend: 1,
        chanceToWinClash: 0,
    },
    {
        taskName: "Terrorism",
        maxMembers: 9,
        minStats: 100,
        minAscend: 4,
        chanceToWinClash: 0,
    },
    {
        taskName: "Human Trafficking",
        maxMembers: 12,
        minStats: 100,
        minAscend: 16,
        chanceToWinClash: 0,
    },
];
const TASK_WARFARE: TaskInfo = {
    taskName: "Territory Warfare",
    maxMembers: CONFIG.ASCENSION.MAX_GANG_SIZE,
    minStats: 100,
    minAscend: 16,
    chanceToWinClash: CONFIG.TERRITORY.MIN_WIN_CHANCE,
};

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    
    // Early exit if prerequisites not met
    const prereqCheck = checkPrerequisites(ns);
    if (!prereqCheck.ready) {
        ns.tprint(`WARN: Gang script cannot run - ${prereqCheck.reason}`);
        return;
    }
    
    const gang = ns.gang;
    const myGang = new PlayerGang(ns);

    if (!gang.inGang() && !myGang.createGang(factionName)) {
        ns.tprint("Could not create a gang!");
        ns.exit();
    }

    TASK_XREF.sort((a, b) => a.maxMembers - b.maxMembers);
    let chanceToWinClash = 1;
    const ALL_EQUIPMENT = ns.gang.getEquipmentNames();

    while (true) {
        ns.clearLog();

        if (myGang.canRecruit) recruit(gang);
        const members = myGang.members;
        const task = TASK_XREF.find((t) => members.length <= t.maxMembers);
        
        if (!task) {
            ns.tprint(`ERROR: No task found for gang size ${members.length}`);
            await ns.sleep(5000);
            continue;
        }
        
        ns.print("Selected: ", task.taskName, ": ", task.maxMembers, " - ", members.length);

        members.forEach((member, i) => {
            tryAscend(ns, member);

            if (myGang.territory > CONFIG.TERRITORY.EQUIPMENT_THRESHOLD) {
                tryBuyEquipment(ns, member, ALL_EQUIPMENT);
            }

            if (i % 2 == 1 && myGang.wantedPenalty < CONFIG.WANTED.PENALTY_THRESHOLD && myGang.wantedLevel > CONFIG.WANTED.LEVEL_THRESHOLD) {
                ns.gang.setMemberTask(member.name, "Vigilante Justice");
            } else if (member.isAscend(TASK_WARFARE.minAscend) && member.canDoTask(TASK_WARFARE) && chanceToWinClash <= CONFIG.TERRITORY.MIN_WIN_CHANCE) {
                if (member.data.task !== TASK_WARFARE.taskName) gang.setMemberTask(member.name, TASK_WARFARE.taskName);
            } else if (member.isAscend(task.minAscend) && member.canDoTask(task)) {
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

function tryAscend(ns: NS, member: PlayerGangMember) {
    const asc = ns.gang.getAscensionResult(member.name);
    if (!asc) return;

    const memberNames = ns.gang.getMemberNames();

    try {
        const stats = ns.gang.getMemberInformation(member.name);
        const maxAscensionGain = Math.max(asc.cha, asc.def, asc.dex, asc.hack, asc.str, asc.agi);
        const currentHighestMult = Math.max(
            stats.cha_asc_mult,
            stats.def_asc_mult,
            stats.dex_asc_mult,
            stats.hack_asc_mult,
            stats.str_asc_mult,
            stats.agi_asc_mult
        );

        // Force ascend for massive gains (2x or more)
        if (maxAscensionGain >= CONFIG.ASCENSION.FORCE_GAIN) {
            ns.gang.ascendMember(member.name);
            ns.print(`${member.name} ascended (${maxAscensionGain.toFixed(2)}x gain)`);
            return;
        }

        // Early game: ascend at lower threshold when we have enough members
        if (maxAscensionGain >= CONFIG.ASCENSION.MIN_GAIN && memberNames.length >= CONFIG.ASCENSION.MIN_MEMBERS_FOR_EARLY_ASCEND) {
            ns.gang.ascendMember(member.name);
            ns.print(`${member.name} ascended (${maxAscensionGain.toFixed(2)}x gain)`);
            return;
        }

        // Push each stat to target multiplier threshold
        if (currentHighestMult < CONFIG.ASCENSION.TARGET_MULTIPLIER) {
            const shouldAscend = (
                (stats.agi_asc_mult * asc.agi >= CONFIG.ASCENSION.TARGET_MULTIPLIER) ||
                (stats.dex_asc_mult * asc.dex >= CONFIG.ASCENSION.TARGET_MULTIPLIER) ||
                (stats.def_asc_mult * asc.def >= CONFIG.ASCENSION.TARGET_MULTIPLIER) ||
                (stats.cha_asc_mult * asc.cha >= CONFIG.ASCENSION.TARGET_MULTIPLIER) ||
                (stats.str_asc_mult * asc.str >= CONFIG.ASCENSION.TARGET_MULTIPLIER) ||
                (stats.hack_asc_mult * asc.hack >= CONFIG.ASCENSION.TARGET_MULTIPLIER)
            );
            
            if (shouldAscend) {
                ns.gang.ascendMember(member.name);
                ns.print(`${member.name} ascended (reached ${CONFIG.ASCENSION.TARGET_MULTIPLIER}x threshold)`);
            }
        }
    } catch (error) {
        ns.print(`ERROR in tryAscend for ${member.name}: ${String(error)}`);
    }
}

function tryBuyEquipment(ns: NS, member: PlayerGangMember, equipmentList: string[]) {
    const buyList = equipmentList
        .filter((e) => !member.data.augmentations.includes(e))
        .filter((e) => !member.data.upgrades.includes(e));

    for (const equipment of buyList) {
        if (ns.getServerMoneyAvailable("home") < ns.gang.getEquipmentCost(equipment)) continue;
        const bought = ns.gang.purchaseEquipment(member.name, equipment);
        if (bought) {
            ns.print(`${member.name} bought ${equipment}`);
        }
    }
}

function tryTerritoryWar(ns: NS) {
    const gangInfo = ns.gang.getGangInformation();
    
    // Already control all territory
    if (gangInfo.territory >= CONFIG.TERRITORY.COMPLETE_CONTROL) {
        if (gangInfo.territoryWarfareEngaged) {
            ns.gang.setTerritoryWarfare(false);
            ns.print("Territory complete - warfare disabled");
        }
        return 1;
    }

    const otherGangsInfo = ns.gang.getOtherGangInformation();
    const otherGangNames = Object.keys(otherGangsInfo);
    const otherGangData = Object.values(otherGangsInfo);
    const otherGangs = otherGangNames.map((gangName, index) => ({
        name: gangName,
        ...otherGangData[index],
    }));

    let minWinChance = 1;
    for (const otherGang of otherGangs) {
        // Skip gangs with no territory or equal power (ties)
        if (otherGang.territory === 0 || gangInfo.power === otherGang.power) {
            continue;
        }
        
        const chanceToWin = ns.gang.getChanceToWinClash(otherGang.name);
        if (chanceToWin < minWinChance) {
            minWinChance = chanceToWin;
        }
    }

    ns.print(`Territory: ${(100 * gangInfo.territory).toFixed(2)}%`);
    ns.print(`Min win chance: ${(100 * minWinChance).toFixed(2)}%`);

    // Engage warfare if we have good odds
    if (minWinChance > CONFIG.TERRITORY.MIN_WIN_CHANCE) {
        if (!gangInfo.territoryWarfareEngaged) {
            ns.gang.setTerritoryWarfare(true);
            ns.print("Territory warfare ENABLED");
        }
    } else {
        if (gangInfo.territoryWarfareEngaged) {
            ns.gang.setTerritoryWarfare(false);
            ns.print("Territory warfare DISABLED (low win chance)");
        }
    }

    return minWinChance;
}

interface OtherGang {
    name: string;
    power: number;
    territory: number;
}

class PlayerGang {
    constructor(private ns: NS) { }

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
        return otherGangNames.map((gangName, index) => ({
            name: gangName,
            ...otherGangData[index],
        }));
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
    constructor(private ns: NS, public name: string) { }

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

    canDoTask(task: TaskInfo) {
        // Check if member has sufficient stats for the task
        // Stats are calculated as: level * asc_mult * mult
        const effectiveAgi = this.stats.agi.level * this.stats.agi.asc_mult * this.stats.agi.mult;
        const effectiveDef = this.stats.def.level * this.stats.def.asc_mult * this.stats.def.mult;
        const effectiveDex = this.stats.dex.level * this.stats.dex.asc_mult * this.stats.dex.mult;
        const effectiveStr = this.stats.str.level * this.stats.str.asc_mult * this.stats.str.mult;

        return (
            effectiveAgi >= task.minStats &&
            effectiveDef >= task.minStats &&
            effectiveDex >= task.minStats &&
            effectiveStr >= task.minStats
        );
    }

    isAscend(goal: number) {
        return (
            Math.max(
                this.stats.agi.asc_mult,
                this.stats.cha.asc_mult,
                this.stats.def.asc_mult,
                this.stats.dex.asc_mult,
                this.stats.hack.asc_mult,
                this.stats.str.asc_mult
            ) >= goal
        );
    }
}

interface TaskInfo {
    taskName: string;
    maxMembers: number;
    minStats: number;
    minAscend: number;
    chanceToWinClash: number;
}