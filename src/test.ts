import { NS } from "@ns";
import { createAutomationWorkflows, createNavigator } from '/navigator';

export async function main(ns: NS): Promise<void> {
    const player = ns.getPlayer();

    const nav = createNavigator(true, ns);
    const workflows = createAutomationWorkflows(nav);

    // High-level automation
    // await workflows.autoHacknet(1000000); // Spend $1M on hacknet
    // await workflows.autoAugmentations(); // Install all purchased augmentations
    // await workflows.autoTravel('New Tokyo'); // Travel to specific city
    const scritps = await workflows.monitorActiveScripts(); // Get list of running scripts

    for (const script of scritps) {
        ns.tprint(`Script: ${script}`);
    }
}