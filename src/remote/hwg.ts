import { NS } from "@ns";
import { IHackScriptArgs } from "/models/IRemoteScriptArgs";

export async function main(ns: NS): Promise<void> {
    if (ns.args.length < 1) {
        return;
    }

    const args = JSON.parse(ns.args[0] as string) as IHackScriptArgs;
    const timeToExecute = args.delayUntil ?? Date.now();
    const delayFor = timeToExecute < 1
        ? 0
        : timeToExecute - Date.now();
    switch (args.type) {
        case "hack":
            await ns.hack(args.hostname, { additionalMsec: delayFor });
            break;
        case "weaken":
            await ns.weaken(args.hostname, { additionalMsec: delayFor });
            break;
        case "grow":
            await ns.grow(args.hostname, { additionalMsec: delayFor });
            break;
    }

}