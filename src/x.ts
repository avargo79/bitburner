// Bitburner React Dialog Menu Script
// Entry point for menu-driven dialog UI
import { NS } from "@ns";

/**
 * Opens a React dialog window with menu-driven controls for game and script interaction.
 * This is a placeholder entry; actual React component will be rendered via Bitburner UI integration.
 */
export async function main(ns: NS): Promise<void> {
  ns.tprint("Opening Bitburner menu dialog...");

  // Bitburner-compatible menu using ns.prompt
  const menuOptions = [
    "Stage 0: Train & Mug",
    "Train Stat",
    "Commit Crime",
    "Run Script",
    "Manage Servers",
    "Solve Contract",
    "Faction Progress",
    "Gang Manager",
    "Corp Manager",
    "Stock Automation",
    "Hacknet Manager",
    "Casino Automation",
    "Reputation Farming",
    "Scheduler",
    "Exit"
  ];

  let exit = false;
  while (!exit) {
     const choice = await ns.prompt("Select a menu action:", { type: "select", choices: menuOptions });
     if (choice === false) { exit = true; break; }
     switch (choice) {
      case "Stage 0: Train & Mug": {
        // --- Stage 0 logic unchanged ---
        const gym = "Powerhouse Gym";
        const statMap = [
          { skill: "strength", gymType: "str" },
          { skill: "defense", gymType: "def" },
          { skill: "dexterity", gymType: "dex" },
          { skill: "agility", gymType: "agi" },
        ] as const;
        for (const { skill, gymType } of statMap) {
          while (ns.getPlayer().skills[skill] < 50) {
            ns.singularity.gymWorkout(gym, gymType, false);
            await ns.sleep(1000);
          }
          ns.tprint(`Trained ${skill} to 50`);
        }
        while (ns.getPlayer().money < 200_000) {
          ns.singularity.commitCrime("Mug", false);
          await ns.sleep(3000);
          ns.tprint(`Current money: $${ns.getPlayer().money}`);
        }
        ns.tprint("Stage 0 complete: All combat stats >= 50, money >= $200,000");
        break;
      }
      case "Train Stat": {
        // --- Stat training logic ---
        const statChoices = ["strength", "defense", "dexterity", "agility", "hacking"];
         const stat = await ns.prompt("Select stat to train:", { type: "select", choices: statChoices });
         if (stat === false) { exit = true; break; }
         const targetStr = await ns.prompt(`Enter target value for ${stat}:`, { type: "text" });
         if (targetStr === false) { exit = true; break; }
         const target = Number(targetStr);
         if (isNaN(target) || target <= 0) {
           ns.tprint("Invalid target value.");
           break;
         }
         let gymType = stat as string;
         if (stat === "strength") gymType = "str";
         if (stat === "defense") gymType = "def";
         if (stat === "dexterity") gymType = "dex";
         if (stat === "agility") gymType = "agi";
         const gym = stat === "hacking" ? "Rothman University" : "Powerhouse Gym";
         if (stat === "hacking") {
           while (ns.getPlayer().skills.hacking < target) {
             ns.singularity.universityCourse(gym, "Algorithms", false);
             await ns.sleep(1000);
           }
         } else {
           while (ns.getPlayer().skills[stat as "strength"|"defense"|"dexterity"|"agility"|"hacking"] < target) {
             ns.singularity.gymWorkout(gym, gymType as "str"|"def"|"dex"|"agi", false);
             await ns.sleep(1000);
           }
         }
         ns.tprint(`Trained ${stat} to ${target}`);
        break;
      }
      case "Commit Crime": {
        // --- Crime automation logic ---
        const crimeChoices = ["Shoplift", "Rob Store", "Mug", "Larceny", "Deal Drugs", "Bond Forgery", "Grand Theft Auto", "Kidnap", "Assassinate", "Heist"];
         const crime = await ns.prompt("Select crime to commit:", { type: "select", choices: crimeChoices });
         if (crime === false) { exit = true; break; }
         const goalStr = await ns.prompt(`Enter target money for ${crime}:`, { type: "text" });
         if (goalStr === false) { exit = true; break; }
         const goal = Number(goalStr);
         if (isNaN(goal) || goal <= 0) {
           ns.tprint("Invalid target money.");
           break;
         }
         while (ns.getPlayer().money < goal) {
            ns.singularity.commitCrime(crime as (
             "Shoplift" | "Rob Store" | "Mug" | "Larceny" | "Deal Drugs" | "Bond Forgery" | "Traffick Arms" | "Homicide" | "Grand Theft Auto" | "Kidnap" | "Assassination" | "Heist"
           ), false);
           await ns.sleep(3000);
           ns.tprint(`Current money: $${ns.getPlayer().money}`);
         }
        ns.tprint(`Crime automation complete: Money >= $${goal}`);
        break;
      }
      case "Run Script": {
        // --- Script runner logic ---
        const scripts = ns.ls("home", ".js").concat(ns.ls("home", ".ts"));
        if (scripts.length === 0) {
          ns.tprint("No scripts found on home.");
          break;
        }
        const script = await ns.prompt("Select script to run:", { type: "select", choices: scripts });
         const argsStr = await ns.prompt(`Enter arguments for ${script} (comma separated):`, { type: "text" });
         if (argsStr === false) break;
         if (script === false) break;
         const args = (argsStr as string).split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
         const pid = ns.run(script as string, 1, ...args);
        ns.tprint(`Started ${script} with PID ${pid} and args: ${args.join(", ")}`);
        break;
      }
      case "Manage Servers": {
        // --- Server manager stub ---
        const serverActions = ["Scan Network", "Analyze Server", "Deploy Script", "Back"];
        let serverExit = false;
        while (!serverExit) {
          const serverChoice = await ns.prompt("Server Manager:", { type: "select", choices: serverActions });
          switch (serverChoice) {
            case "Scan Network": {
              const servers = ns.scan();
              ns.tprint(`Servers: ${servers.join(", ")}`);
              break;
            }
            case "Analyze Server": {
              const servers = ns.scan();
               const server = await ns.prompt("Select server to analyze:", { type: "select", choices: servers });
               if (server === false) break;
               const info = ns.getServer(server as string);
               ns.tprint(`Info for ${server}: ${JSON.stringify(info)}`);
              break;
            }
            case "Deploy Script": {
              ns.tprint("Deploy Script: Not yet implemented");
              break;
            }
            case "Back":
              serverExit = true;
              break;
            default:
              ns.tprint(`Selected: ${serverChoice} (not yet implemented)`);
              break;
          }
        }
        break;
      }
      case "Exit":
        exit = true;
        break;
      default:
        ns.tprint(`Selected: ${choice} (not yet implemented)`);
        break;
    }
  }

  /**
   * Usage:
   * - This script is the entry point for the React dialog menu.
   * - The DialogMenu component (DialogMenu.tsx) is designed for extensibility.
   * - Add new menu actions by extending DialogMenu and connecting handlers here.
   * - For Bitburner UI integration, see project documentation and future UI hooks.
   */
}


