import { NS } from '@ns';

/**
 * Reputation Boost Script
 * 
 * Executes the share script (remote/sh.js) on home server using 80% of available RAM.
 * This script automatically calculates available RAM and spawns sharing threads
 * to boost faction reputation gain through the sharing mechanic.
 * 
 * Usage: run repboost.js
 */

export async function main(ns: NS): Promise<void> {
    const homeServer = 'home';
    const shareScript = '/remote/sh.js';
    const ramUsagePercentage = 0.8; // Use 80% of available RAM

    // Get RAM information for home server
    const maxRam = ns.getServerMaxRam(homeServer);
    const usedRam = ns.getServerUsedRam(homeServer);
    const availableRam = maxRam - usedRam;

    // Calculate RAM to use (80% of available)
    const ramToUse = availableRam * ramUsagePercentage;

    // Get RAM cost of the share script
    const scriptRamCost = ns.getScriptRam(shareScript, homeServer);

    // Calculate maximum threads we can run
    const maxThreads = Math.floor(ramToUse / scriptRamCost);

    // Validation checks
    if (maxThreads <= 0) {
        ns.tprint('ERROR: Not enough available RAM to run share script');
        ns.tprint(`Available RAM: ${ns.formatNumber(availableRam)}GB`);
        ns.tprint(`Script RAM cost: ${ns.formatNumber(scriptRamCost)}GB`);
        return;
    }

    if (!ns.fileExists(shareScript, homeServer)) {
        ns.tprint(`ERROR: Share script not found: ${shareScript}`);
        return;
    }

    // Generate a batch ID for tracking
    const batchId = `repboost-${Date.now()}`;

    // Execute the share script
    const pid = ns.exec(shareScript, homeServer, maxThreads, batchId, 1.0, false);

    if (pid === 0) {
        ns.tprint('ERROR: Failed to execute share script');
        return;
    }

    // Print execution details
    ns.tprint('=== REPUTATION BOOST STARTED ===');
    ns.tprint(`Server: ${homeServer}`);
    ns.tprint(`Script: ${shareScript}`);
    ns.tprint(`Threads: ${ns.formatNumber(maxThreads)}`);
    ns.tprint(`RAM Usage: ${ns.formatNumber(maxThreads * scriptRamCost)}GB / ${ns.formatNumber(availableRam)}GB available (${(ramUsagePercentage * 100).toFixed(1)}%)`);
    ns.tprint(`Batch ID: ${batchId}`);
    ns.tprint(`Process ID: ${pid}`);
    ns.tprint('================================');

    ns.print(`Successfully started reputation boost with ${maxThreads} threads`);
    ns.print(`Using ${ns.formatNumber(maxThreads * scriptRamCost)}GB of ${ns.formatNumber(availableRam)}GB available RAM`);
}