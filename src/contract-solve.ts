/** @param {NS} ns */

import type { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
	// Attempt to solve a contract
	// RAM: attempt(10GB) = 10GB total
	
	const args = ns.args
	if (args.length !== 3) {
		ns.tprint('Usage: contract-solve.js [solution] [contract-file] [server]')
		return
	}
	
	const solution = args[0] // Can be string, number, or array
	const contractFile = args[1] as string
	const server = args[2] as string
	
	try {
		// Parse solution if it's a JSON string
		let parsedSolution = solution
		if (typeof solution === 'string' && (solution.startsWith('[') || solution.startsWith('{'))) {
			try {
				parsedSolution = JSON.parse(solution)
			} catch {
				// Use as-is if JSON parsing fails
			}
		}
		
		const reward = ns.codingcontract.attempt(parsedSolution, contractFile, server)
		
		const result = {
			success: !!reward,
			reward: reward || null,
			solution: parsedSolution,
			contractFile,
			server,
			timestamp: Date.now()
		}
		
		// Write results to unique file
		const filename = `/temp/contract-solve-${server}-${contractFile.replace('.cct', '')}.txt`
		ns.write(filename, JSON.stringify(result), 'w')
		
	} catch (error) {
		const result = {
			success: false,
			error: String(error),
			solution,
			contractFile,
			server,
			timestamp: Date.now()
		}
		
		const filename = `/temp/contract-solve-${server}-${contractFile.replace('.cct', '')}.txt`
		ns.write(filename, JSON.stringify(result), 'w')
	}
}