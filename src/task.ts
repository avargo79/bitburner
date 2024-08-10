import { AutocompleteData, NS, ScriptArg } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { TaskNames } from "/daemon";
import PrettyTable from "/lib/prettytable";
import { IScriptTask } from "/models/ScriptTask";

const argsSchema: [string, string | number | boolean | string[]][] = [
   ['enable', false],
   ['disable', false],
   ['interval', 0],
   ['priority', 0],
   ['list', false],
]

const taskNames: string[] = Object.keys(TaskNames);

export function autocomplete(data: AutocompleteData, args: string[]) {
   data.flags(argsSchema);

   if (args.length < 1 || (args.length < 2 && !taskNames.includes(args[0]))) return taskNames;
   if (args.length < 2) return data.txts;

   return [];
}

function validateOptions(ns: NS, options: { [key: string]: string[] | ScriptArg; }) {
   if (options.enable && options.disable) {
      ns.tprint("Cannot enable and disable a task at the same time.");
      ns.exit();
   }

   if (isNaN(Number(options.interval))) {
      ns.tprint("Interval must be a number.");
      ns.exit();
   }

   if (isNaN(Number(options.priority))) {
      ns.tprint("Priority must be a number.");
      ns.exit();
   }
}

export async function main(ns: NS): Promise<void> {
   const options = ns.flags(argsSchema);
   validateOptions(ns, options);

   const database = await Database.getInstance();
   await database.open();

   options.list
      ? await listTasks(database, ns)
      : await updateTask(ns, database, options);
}


async function listTasks(database: Database, ns: NS) {
   const tasks = await database.getAll<IScriptTask>(DatabaseStoreName.Tasks);
   tasks.sort((a, b) => b.priority - a.priority || b.interval - a.interval || a.name.localeCompare(b.name));

   const pt = new PrettyTable();
   const headers = ["Name", "Priority", "Interval(ms)", "Enabled", "Last Run"];
   const rows = tasks.map((t) => [
      t.name, t.priority, t.interval, t.enabled, new Date(t.lastRun).toLocaleString()
   ]);

   pt.create(headers, rows);

   ns.tprint(pt.print());
}

async function updateTask(ns: NS, database: Database, options: { [key: string]: string[] | ScriptArg; }) {
   const taskName = ns.args[0] as TaskNames;
   const task = await database.get<IScriptTask>(DatabaseStoreName.Tasks, taskName);

   if (task === undefined) {
      ns.tprint('Task not found.  Valid tasks are: ' + taskNames.join(', '));
      ns.exit();
   }

   const orgTask = { ...task };

   task.enabled = options.enable ? true : options.disable ? false : task.enabled;
   task.interval = options.interval as number > 0 ? options.interval as number : task.interval;
   task.priority = options.priority as number > 0 ? options.priority as number : task.priority;

   if (JSON.stringify(orgTask) !== JSON.stringify(task)) {
      await database.saveRecord(DatabaseStoreName.Tasks, task);
      ns.tprint('Task updated.');
   }
}

