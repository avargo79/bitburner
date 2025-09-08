import { NS } from "@ns";
import { Configuration } from "lib/configuration";

export async function main(ns: NS) {
    const config = await Configuration.getInstance();
    let strategy;
    try {
        // Defensive: config.get may throw or return undefined/null
        strategy = await config.get('stockTrading');
    } catch (e) {
        ns.tprint("No stockTrading config found (exception).");
        return;
    }
    if (!strategy) {
        ns.tprint("No stockTrading config found (null/undefined).");
    } else {
        ns.tprint("=== Stock Trading Strategy Config ===");
        ns.tprint(JSON.stringify(strategy, null, 2));
    }
}
