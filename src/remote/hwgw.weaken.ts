import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const hostname = ns.args[0] as string;
    const delayUntil = ns.args.length > 1 ? (ns.args[1] as number) - Date.now() : 0;
    
    if(delayUntil > 0) {
        await ns.sleep(delayUntil);
    }

    await ns.weaken(hostname);
}