import { NS } from "@ns";

const runtimeMultiplier = 4.0;

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0] as string;
  const repeat = ns.args[1];
  const batch_land = ns.args[2] as number;

  const runtime = runtimeMultiplier * ns.getHackTime(target);

  do {
    if (batch_land) {
      const currentTime = performance.now();
      await ns.sleep(batch_land - currentTime - runtime);
    }
    await ns.weaken(target);
  } while (repeat);
}
