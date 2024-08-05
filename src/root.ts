import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const hostname = '';
    try{ ns.brutessh(hostname); ns.ftpcrack(hostname); ns.relaysmtp(hostname); ns.httpworm(hostname); ns.sqlinject(hostname); } catch(e){}
    try{ ns.nuke(hostname); } catch(e){}
}