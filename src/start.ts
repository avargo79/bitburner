import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptResetInfo } from "/models/IScriptResetInfo";

export async function main(ns: NS): Promise<void> {
   const database = await Database.getInstance();
   await database.open();

   // If it's only been 5 minutes since the last reset or aug install, clear object stores
   const ResetInfo = await database.get<IScriptResetInfo>(DatabaseStoreName.NS_Data, "ns.getResetInfo");
   const destroyedBitNodeRecently = Date.now() - ResetInfo.lastNodeReset < 300000;
   const installedAugsRecently = Date.now() - ResetInfo.lastAugReset < 300000;
   if (!ResetInfo || destroyedBitNodeRecently) {
      ns.tprint("Resetting database after bitnode destruction");
      await database.clear(DatabaseStoreName.Tasks);
      await database.clear(DatabaseStoreName.Servers);
      await database.clear(DatabaseStoreName.NS_Data);
      await database.clear(DatabaseStoreName.Contracts);
      await database.clear(DatabaseStoreName.Configuration);

   } else if (installedAugsRecently) {
      ns.tprint("Resetting database after installing augments");
      await database.clear(DatabaseStoreName.Servers);
      await database.clear(DatabaseStoreName.NS_Data);
      await database.clear(DatabaseStoreName.Contracts);
      await database.clear(DatabaseStoreName.Configuration);
   }

   ns.run("daemon.js");
}


