import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptResetInfo } from "./lib/models";

export async function main(ns: NS): Promise<void> {
   const database = await Database.getInstance();
   await database.open();

   // If it's only been 5 minutes since the last reset, clear the database
   const ResetInfo = await database.get<IScriptResetInfo>(DatabaseStoreName.NS_Data, "ns.getResetInfo");
   if ((ResetInfo && Date.now() - ResetInfo.lastNodeReset < 300000) || !ResetInfo) {
      await database.clear(DatabaseStoreName.Tasks);
      await database.clear(DatabaseStoreName.Servers);
      await database.clear(DatabaseStoreName.NS_Data);
      await database.clear(DatabaseStoreName.Contracts);

      await ns.sleep(1000);
   }

   ns.run("daemon.js");
}


