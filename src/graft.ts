import { NS } from "@ns";

type CityName = Parameters<NS["singularity"]["travelToCity"]>[0];
type CurrentWork = ReturnType<NS["singularity"]["getCurrentWork"]>;

type AugStatus = "ready" | "money";

interface AugPlan {
    name: string;
    price: number;
    time: number;
    status: AugStatus;
    missingFunds: number;
}

const TARGET_CITY: CityName = "New Tokyo";
const VENDOR_LABEL = "VitaLife";
const LOOP_DELAY_MS = 2000;
const DASHBOARD_QUEUE_LENGTH = 5;
const TRAVEL_COST = 200_000;
const GRAFT_FOCUS = true;

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.clearLog();
    ns.ui.openTail();

    while (true) {
        await ensureInCity(ns);

        const currentWork = ns.singularity.getCurrentWork();
        const plans = buildAugmentationPlans(ns) ?? [];
        const nextPlan = plans.at(0);
        const isGrafting = currentWork?.type === "GRAFTING";

        if (!isGrafting && nextPlan && nextPlan.status === "ready") {
            const started = ns.grafting.graftAugmentation(nextPlan.name, GRAFT_FOCUS);
            if (started) {
                ns.toast(`Grafting ${nextPlan.name} (${formatDuration(ns, nextPlan.time)})`, "success", 4000);
            } else {
                ns.print(`[${VENDOR_LABEL}] Failed to start grafting ${nextPlan.name}.`);
            }
        }

        renderDashboard(ns, plans, currentWork);
        await ns.sleep(LOOP_DELAY_MS);
    }
}

async function ensureInCity(ns: NS): Promise<void> {
    const city = ns.getPlayer().city;
    if (city === TARGET_CITY) {
        return;
    }

    const funds = ns.getServerMoneyAvailable("home");
    if (funds < TRAVEL_COST) {
        ns.print(`[${VENDOR_LABEL}] Need ${formatMoney(ns, TRAVEL_COST)} to travel (${formatMoney(ns, funds)} available).`);
        return;
    }

    const traveled = ns.singularity.travelToCity(TARGET_CITY);
    if (traveled) {
        ns.print(`[${VENDOR_LABEL}] Traveling to ${TARGET_CITY}.`);
        await ns.sleep(200);
    } else {
        ns.print(`[${VENDOR_LABEL}] Failed to travel to ${TARGET_CITY}.`);
    }
}

function buildAugmentationPlans(ns: NS): AugPlan[] {
    try {
        const funds = ns.getServerMoneyAvailable("home");
        return ns.grafting
            .getGraftableAugmentations()
            .map(name => {
                const price = ns.grafting.getAugmentationGraftPrice(name);
                const time = ns.grafting.getAugmentationGraftTime(name);
                const missingFunds = Math.max(0, price - funds);
                const status: AugStatus = missingFunds === 0 ? "ready" : "money";
                return { name, price, time, status, missingFunds };
            })
            .sort((a, b) => {
                if (a.time !== b.time) return a.time - b.time;
                if (a.price !== b.price) return a.price - b.price;
                return a.name.localeCompare(b.name);
            });
    } catch (err) {
        ns.print(`[${VENDOR_LABEL}] Unable to read graft queue: ${String(err)}`);
        return [];
    }
}

function renderDashboard(ns: NS, plans: AugPlan[], currentWork: CurrentWork | null): void {
    ns.clearLog();
    const player = ns.getPlayer();
    const funds = ns.getServerMoneyAvailable("home");
    const isGrafting = currentWork?.type === "GRAFTING";

    ns.print(`[${VENDOR_LABEL}] Grafting queue (fastest + cheapest first)`);
    ns.print(`City       : ${player.city} ${player.city === TARGET_CITY ? "(✅ New Tokyo)" : `(travel to ${TARGET_CITY})`}`);
    ns.print(`Funds      : ${formatMoney(ns, funds)}`);
    ns.print(`Status     : ${isGrafting ? `Grafting ${currentWork.augmentation}` : "Idle"}`);
    ns.print("");

    if (!plans.length && !isGrafting) {
        ns.print("No graftable augmentations available right now.");
        return;
    }

    if (isGrafting && currentWork) {
        ns.print(`Current graft: ${describeCurrentGraft(ns, currentWork.augmentation)}`);
    } else if (plans.length) {
        ns.print(`Next graft target: ${describeAug(plans[0], ns)}`);
    }
    ns.print("");

    const queueStartIndex = isGrafting ? 0 : 1;
    const upcoming = plans.slice(queueStartIndex, queueStartIndex + DASHBOARD_QUEUE_LENGTH);
    if (!upcoming.length) {
        ns.print("No additional augmentations queued.");
        return;
    }

    ns.print(`Next ${upcoming.length} planned:`);
    upcoming.forEach((plan, idx) => {
        ns.print(` ${idx + 1}. ${describeAug(plan, ns)}`);
    });
}

function describeAug(plan: AugPlan, ns: NS): string {
    const statusText = plan.status === "ready" ? "READY" : `Need ${formatMoney(ns, plan.missingFunds)}`;
    return `${plan.name} | ${formatMoney(ns, plan.price)} | ${formatDuration(ns, plan.time)} | ${statusText}`;
}

function describeCurrentGraft(ns: NS, augName: string): string {
    let price: number | undefined;
    let time: number | undefined;
    try {
        price = ns.grafting.getAugmentationGraftPrice(augName);
    } catch {
        price = undefined;
    }

    try {
        time = ns.grafting.getAugmentationGraftTime(augName);
    } catch {
        time = undefined;
    }

    const priceText = price !== undefined ? formatMoney(ns, price) : "unknown cost";
    const timeText = time !== undefined ? formatDuration(ns, time) : "unknown time";
    return `${augName} | ${priceText} | ${timeText}`;
}

function formatMoney(ns: NS, amount: number): string {
    if (!Number.isFinite(amount)) return "$0";
    try {
        return ns.nFormat(amount, "$0.00a");
    } catch {
        return `$${amount.toFixed(2)}`;
    }
}

function formatDuration(ns: NS, milliseconds: number): string {
    if (!Number.isFinite(milliseconds)) {
        return "0s";
    }

    try {
        return ns.tFormat(milliseconds);
    } catch {
        const seconds = Math.max(0, milliseconds / 1000);
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
    }
}
