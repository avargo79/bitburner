import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const serverName = ns.args[0] as string || "pserve-1";
    
    ns.tprint(`=== RAM DIAGNOSTIC FOR ${serverName} ===`);
    
    // Check if server exists
    if (!ns.serverExists(serverName)) {
        ns.tprint(`ERROR: Server ${serverName} does not exist!`);
        return;
    }
    
    // Get server info
    const maxRam = ns.getServerMaxRam(serverName);
    const usedRam = ns.getServerUsedRam(serverName);
    const freeRam = maxRam - usedRam;
    
    ns.tprint(`Max RAM: ${maxRam} GB`);
    ns.tprint(`Used RAM: ${usedRam} GB`);
    ns.tprint(`Free RAM: ${freeRam} GB`);
    ns.tprint(`Usage: ${((usedRam / maxRam) * 100).toFixed(1)}%`);
    
    // Check running processes
    const processes = ns.ps(serverName);
    ns.tprint(`\nRunning processes: ${processes.length}`);
    
    if (processes.length > 0) {
        processes.forEach(proc => {
            ns.tprint(`  - ${proc.filename} (${proc.threads} threads, ${proc.args.join(', ')})`);
        });
    }
    
    // Test script execution
    ns.tprint(`\nTesting script execution...`);
    
    // Check if simple scripts exist
    const scripts = ["simple-hack.js", "simple-weaken.js", "simple-grow.js"];
    for (const script of scripts) {
        if (ns.fileExists(script, "home")) {
            ns.tprint(`✓ ${script} exists`);
        } else {
            ns.tprint(`✗ ${script} missing`);
        }
    }
    
    // Try to start a simple test script
    if (ns.fileExists("simple-weaken.js", "home") && freeRam >= 2) {
        ns.tprint(`\nTesting simple-weaken.js with 1 thread...`);
        const pid = ns.exec("simple-weaken.js", serverName, 1, "home", Date.now() + 1000);
        if (pid > 0) {
            ns.tprint(`✓ Successfully started script (PID: ${pid})`);
        } else {
            ns.tprint(`✗ Failed to start script`);
        }
    }
}