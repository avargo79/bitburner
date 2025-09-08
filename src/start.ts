import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
   const resetInfo = ns.getResetInfo();

   // If it's only been 5 minutes since the last reset
   if (resetInfo.lastNodeReset < 300000) {
      ns.tprint("Recent bitnode destruction detected");
   }

   // If it's only been 5 minutes since the last aug install
   if (resetInfo.lastAugReset < 300000) {
      ns.tprint("Recent augmentation installation detected");
   }

   ns.tprint("Game state detected. Use standalone scripts (botnet.js, stocks.js, contracts.js, hacknet.js) for automation.");
}


