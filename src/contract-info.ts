/** @param {NS} ns */

import type { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
	// Get contract information (type, data, tries remaining)
	// RAM: getContractType(5GB) + getData(5GB) + getNumTriesRemaining(2GB) = 12GB total
	
	const args = ns.args
	if (args.length !== 2) {
		ns.tprint('Usage: contract-info.js [contract-file] [server]')
		return
	}
	
	const contractFile = args[0] as string
	const server = args[1] as string
	
	try {
		const contractType = ns.codingcontract.getContractType(contractFile, server)
		const data = ns.codingcontract.getData(contractFile, server)
		const triesRemaining = ns.codingcontract.getNumTriesRemaining(contractFile, server)
		
		const result = {
			success: true,
			contractType,
			data,
			triesRemaining,
			contractFile,
			server,
			timestamp: Date.now()
		}
		
		// Write results to unique file
		const filename = `/temp/contract-info-${server}-${contractFile.replace('.cct', '')}.txt`
		ns.write(filename, JSON.stringify(result), 'w')
		
	} catch (error) {
		const result = {
			success: false,
			error: String(error),
			contractFile,
			server,
			timestamp: Date.now()
		}
		
		const filename = `/temp/contract-info-${server}-${contractFile.replace('.cct', '')}.txt`
		ns.write(filename, JSON.stringify(result), 'w')
	}
}