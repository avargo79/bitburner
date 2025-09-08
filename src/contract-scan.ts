/** @param {NS} ns */

import type { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
	// Get all servers and their contracts
	// RAM: scan(0.2GB) + ls(0.2GB) = 0.4GB total
	
	// Clean up old temp files first
	try {
		const tempFiles = ns.ls('home', 'temp/')
		for (const file of tempFiles) {
			if (file.includes('contract-') && (file.includes('-info-') || file.includes('-solve-') || file.includes('-scan-'))) {
				ns.rm(file)
			}
		}
	} catch (e) {
		// Ignore cleanup errors
	}
	
	const visited = new Set<string>()
	const queue = ['home']
	const result: Array<{server: string, contracts: string[]}> = []
	
	// Breadth-first network scan
	while (queue.length > 0) {
		const current = queue.shift()!
		if (visited.has(current)) continue
		
		visited.add(current)
		
		try {
			// Get contracts on this server - filter out temp files
			const allFiles = ns.ls(current, '.cct')
			const contracts = allFiles.filter(file => 
				!file.startsWith('temp/') && 
				!file.includes('contract-') &&
				file.endsWith('.cct')
			)
			
			if (contracts.length > 0) {
				result.push({server: current, contracts})
			}
			
			// Add neighbors to queue
			const neighbors = ns.scan(current)
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor)) {
					queue.push(neighbor)
				}
			}
		} catch (e) {
			// Skip inaccessible servers
			continue
		}
	}
	
	// Write results to file for main script to read
	ns.write('/temp/contract-scan-results.txt', JSON.stringify({
		timestamp: Date.now(),
		totalServers: visited.size,
		contractData: result
	}), 'w')
}