import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    // Get all files on home server
    const files = ns.ls("home");
    
    // Filter for batch-debug files
    const debugFiles = files.filter(file => file.startsWith("batch-debug") && file.endsWith(".txt"));
    
    if (debugFiles.length === 0) {
        ns.tprint("No batch-debug files found to delete.");
        return;
    }
    
    ns.tprint(`Found ${debugFiles.length} batch-debug files:`);
    debugFiles.forEach(file => ns.tprint(`  - ${file}`));
    
    // Delete each file
    let deletedCount = 0;
    for (const file of debugFiles) {
        if (ns.rm(file)) {
            deletedCount++;
            ns.tprint(`Deleted: ${file}`);
        } else {
            ns.tprint(`Failed to delete: ${file}`);
        }
    }
    
    ns.tprint(`\nCleanup complete: ${deletedCount}/${debugFiles.length} files deleted.`);
}