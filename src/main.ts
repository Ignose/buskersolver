import { getProperty, mallPrice, print, toInt } from "kolmafia";
import { Args, getTasks } from "grimoire-kolmafia";
import { ProfitTrackingEngine } from "./engine";
import { DoWaffles } from "./doWaffles";
import { args } from "./args";
import { getBestFreeFightMonster, sim } from "./lib";
import { $familiar, $item, get, have } from "libram";

const version = "0.0.1";

export function main(command?: string): void {
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  print(`Running: wafflo v${version}`);

  const tasks = getTasks([DoWaffles()]);

  if (args.abort) {
    const to_abort = tasks.find((task) => task.name === args.abort);
    if (!to_abort) throw `Unable to identify task ${args.abort}`;
    to_abort.prepare = (): void => {
      throw `Abort requested`;
    };
  }

  if (args.sim) {
    sim();
  }

  const engine = new ProfitTrackingEngine(tasks, "waffle_tracker");
  try {
    engine.run(args.actions);
    // Print the next task that will be executed, if it exists
    const task = engine.getNextTask();
    if (task) {
      print(`Next: ${task.name}`, "blue");
    }
  } finally {
    engine.destruct();
  }
}
