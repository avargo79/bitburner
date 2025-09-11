import { NS } from "@ns";

/** 
 * Remote server purchasing script  
 * Handles server purchasing to avoid purchaseServer/getPurchasedServerCost RAM costs in main script
 * Args: [serverName, ram, debug]
 * @param {NS} ns 
 */
export async function main(ns: NS): Promise<void> {
    const serverName = ns.args[0] as string;
    const ram = ns.args[1] as number;
    const debug = (ns.args[2] as string) === "true";
    
    if (!serverName || !ram) {
        if (debug) ns.tprint("ERROR: Missing serverName or ram arguments");
        return;
    }

    // Check if we can afford it
    const cost = ns.getPurchasedServerCost(ram);
    const playerMoney = ns.getServerMoneyAvailable('home');
    
    if (playerMoney < cost) {
        if (debug) ns.tprint(`FAILED: Cannot afford server ${serverName} (${ns.formatNumber(cost)} > ${ns.formatNumber(playerMoney)})`);
        return;
    }

    try {
        const hostname = ns.purchaseServer(serverName, ram);
        if (hostname) {
            if (debug) ns.tprint(`SUCCESS: Purchased server ${hostname} with ${ram}GB RAM for ${ns.formatNumber(cost)}`);
        } else {
            if (debug) ns.tprint(`FAILED: Could not purchase server ${serverName}`);
        }
    } catch (error) {
        if (debug) ns.tprint(`ERROR: Failed to purchase server ${serverName}: ${error}`);
    }
}