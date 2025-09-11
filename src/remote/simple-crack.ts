import { NS } from "@ns";

/** 
 * Remote server cracking and rooting script
 * Handles all port cracking tools and nuking operations
 * Args: [target, debug]
 * @param {NS} ns 
 */
export async function main(ns: NS): Promise<void> {
    const target = ns.args[0] as string;
    const debug = (ns.args[1] as string) === "true";
    
    if (!target) {
        if (debug) ns.tprint("ERROR: No target server specified");
        return;
    }

    // Already rooted check
    if (ns.hasRootAccess(target)) {
        if (debug) ns.tprint(`ALREADY: ${target} already rooted`);
        return;
    }

    // Check required hacking level
    const requiredLevel = ns.getServerRequiredHackingLevel(target);
    const playerLevel = ns.getHackingLevel();
    
    if (playerLevel < requiredLevel) {
        if (debug) ns.tprint(`FAILED: ${target} requires hacking level ${requiredLevel} (current: ${playerLevel})`);
        return;
    }

    // Crack available ports
    const crackedPorts = [];
    let portsCracked = 0;
    
    if (ns.fileExists("BruteSSH.exe", "home")) {
        try { ns.brutessh(target); portsCracked++; crackedPorts.push("SSH"); } catch {}
    }
    
    if (ns.fileExists("FTPCrack.exe", "home")) {
        try { ns.ftpcrack(target); portsCracked++; crackedPorts.push("FTP"); } catch {}
    }
    
    if (ns.fileExists("relaySMTP.exe", "home")) {
        try { ns.relaysmtp(target); portsCracked++; crackedPorts.push("SMTP"); } catch {}
    }
    
    if (ns.fileExists("HTTPWorm.exe", "home")) {
        try { ns.httpworm(target); portsCracked++; crackedPorts.push("HTTP"); } catch {}
    }
    
    if (ns.fileExists("SQLInject.exe", "home")) {
        try { ns.sqlinject(target); portsCracked++; crackedPorts.push("SQL"); } catch {}
    }

    // Attempt to nuke
    try {
        ns.nuke(target);
        if (debug) ns.tprint(`SUCCESS: Rooted ${target} (${portsCracked} ports: ${crackedPorts.join(', ')})`);
    } catch (error) {
        if (debug) ns.tprint(`FAILED: Could not nuke ${target} - insufficient ports (${portsCracked} cracked: ${crackedPorts.join(', ')})`);
    }
}