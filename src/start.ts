import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptResetInfo } from "/models/IScriptResetInfo";
import { DynamicScript, getDynamicScriptContent } from "/lib/system";

export async function main(ns: NS): Promise<void> {
   const database = await Database.getInstance();
   await database.open();

   await database.clear(DatabaseStoreName.Servers);
   await database.clear(DatabaseStoreName.NS_Data);

   await database.saveRecord(DatabaseStoreName.Configuration, { key: "purchasedServersTask.js", value: { maxPower: 13 } });
   await new DynamicScript("ns.getResetInfo", getDynamicScriptContent("ns.getResetInfo", "ns.getResetInfo()", DatabaseStoreName.NS_Data)).run(ns);

   // If it"s only been 5 minutes since the last reset
   const ResetInfo = await database.get<IScriptResetInfo>(DatabaseStoreName.NS_Data, "ns.getResetInfo");
   if (ResetInfo.lastNodeReset < 300000) {
      ns.tprint("Resetting database after bitnode destruction");
   }

   // If it"s only been 5 minutes since the last aug install
   if (ResetInfo.lastAugReset < 300000) {
      ns.tprint("Resetting database after installing augments");
   }

   ns.run("daemon.js");
}


