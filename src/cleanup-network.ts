import { NS } from "@ns";

/**
 * Network Script Cleanup Tool
 * 
 * Deletes all script files (.js, .ts) from all servers in the network except 'home'.
 * Useful for cleaning up after botnet operations or when testing new scripts.
 * 
 * Usage:
 *   run cleanup-network.js
 *   run cleanup-network.js --dry-run=true    # Preview what would be deleted
 *   run cleanup-network.js --confirm=true    # Skip confirmation prompt
 */

interface CleanupStats {
    serversScanned: number;
    serversWithScripts: number;
    totalFilesDeleted: number;
    failedDeletions: number;
}

function getServerList(ns: NS, host: string = 'home', network = new Set<string>()): string[] {
    network.add(host);
    ns.scan(host).filter((hostname: string) => !network.has(hostname)).forEach((neighbor: string) => getServerList(ns, neighbor, network));
    return [...network];
}

export async function main(ns: NS): Promise<void> {
    const args = ns.flags([
        ['dry-run', false],
        ['confirm', false],
        ['help', false]
    ]);

    if (args.help) {
        ns.tprint("Network Script Cleanup Tool");
        ns.tprint("Usage: run cleanup-network.js [options]");
        ns.tprint("");
        ns.tprint("Options:");
        ns.tprint("  --dry-run=true    Preview what would be deleted (no actual deletion)");
        ns.tprint("  --confirm=true    Skip confirmation prompt");
        ns.tprint("  --help=true       Show this help message");
        return;
    }

    const isDryRun = args['dry-run'] as boolean;
    const skipConfirm = args['confirm'] as boolean;

    ns.tprint("=== Network Script Cleanup ===");
    ns.tprint(`Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'LIVE DELETION'}`);
    ns.tprint("");

    // Get all servers except home
    const allServers = getServerList(ns);
    const targetServers = allServers.filter(hostname => hostname !== 'home');

    ns.tprint(`Scanning ${targetServers.length} servers for script files...`);

    const stats: CleanupStats = {
        serversScanned: 0,
        serversWithScripts: 0,
        totalFilesDeleted: 0,
        failedDeletions: 0
    };

    const deletionPlan: { hostname: string; files: string[] }[] = [];

    // Scan all servers for script files
    for (const hostname of targetServers) {
        stats.serversScanned++;
        
        try {
            const server = ns.getServer(hostname);
            if (!server.hasAdminRights) {
                continue; // Skip servers we can't access
            }

            // Get all files and filter for script files
            const allFiles = ns.ls(hostname);
            const scriptFiles = allFiles.filter(file => 
                file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.script')
            );

            if (scriptFiles.length > 0) {
                stats.serversWithScripts++;
                deletionPlan.push({ hostname, files: scriptFiles });
                
                ns.tprint(`${hostname}: ${scriptFiles.length} script files found`);
                if (scriptFiles.length <= 10) {
                    // Show all files if 10 or fewer
                    scriptFiles.forEach(file => ns.tprint(`  - ${file}`));
                } else {
                    // Show first 5 and summary if more than 10
                    scriptFiles.slice(0, 5).forEach(file => ns.tprint(`  - ${file}`));
                    ns.tprint(`  ... and ${scriptFiles.length - 5} more files`);
                }
            }
        } catch (e) {
            // Skip servers that can't be accessed
            continue;
        }
    }

    const totalFilesToDelete = deletionPlan.reduce((sum, plan) => sum + plan.files.length, 0);

    ns.tprint("");
    ns.tprint("=== Cleanup Summary ===");
    ns.tprint(`Servers scanned: ${stats.serversScanned}`);
    ns.tprint(`Servers with scripts: ${stats.serversWithScripts}`);
    ns.tprint(`Total script files to delete: ${totalFilesToDelete}`);

    if (totalFilesToDelete === 0) {
        ns.tprint("No script files found to delete. Network is already clean!");
        return;
    }

    if (isDryRun) {
        ns.tprint("");
        ns.tprint("DRY RUN COMPLETE - No files were actually deleted");
        ns.tprint("Run without --dry-run=true to perform actual deletion");
        return;
    }

    // Confirmation prompt (unless skipped)
    if (!skipConfirm) {
        ns.tprint("");
        ns.tprint("⚠️  WARNING: This will permanently delete all script files from the network!");
        ns.tprint("⚠️  Make sure you have backups if needed.");
        ns.tprint("");
        ns.tprint("To proceed with deletion, run:");
        ns.tprint("  run cleanup-network.js --confirm=true");
        return;
    }

    // Perform actual deletion
    ns.tprint("");
    ns.tprint("Starting deletion...");

    for (const plan of deletionPlan) {
        ns.tprint(`Cleaning ${plan.hostname}...`);
        
        for (const file of plan.files) {
            try {
                const success = ns.rm(file, plan.hostname);
                if (success) {
                    stats.totalFilesDeleted++;
                } else {
                    stats.failedDeletions++;
                    ns.tprint(`  Failed to delete: ${file}`);
                }
            } catch (e) {
                stats.failedDeletions++;
                ns.tprint(`  Error deleting ${file}: ${e}`);
            }
        }
    }

    ns.tprint("");
    ns.tprint("=== Cleanup Complete ===");
    ns.tprint(`Files successfully deleted: ${stats.totalFilesDeleted}`);
    ns.tprint(`Failed deletions: ${stats.failedDeletions}`);
    
    if (stats.failedDeletions > 0) {
        ns.tprint("Some files could not be deleted (may be currently running)");
    } else {
        ns.tprint("Network cleanup successful! All script files removed.");
    }
}