import { NS } from "@ns";

export function getServerList(ns: NS, host: string = 'home', network = new Set<string>()): string[] {
    network.add(host);
    ns.scan(host).filter(hostname => !network.has(hostname)).forEach((neighbor) => getServerList(ns, neighbor, network));
    return [...network];
}