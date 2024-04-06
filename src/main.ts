import { print } from "kolmafia";
import { Task } from "./task";
import { getTasks } from "grimoire-kolmafia";
import { ProfitTrackingEngine } from "./engine";
import { DoSetup } from "./doSetup";
import { ExecuteWaffles } from "./executeWaffles";
import { get } from "libram";

const version = "0.0.1";

export function main(): void {
  print(`Running: wafflo v${version}`);

  const tasks: Task[] = getTasks([DoSetup(), ExecuteWaffles()]);

  const engine = new ProfitTrackingEngine(tasks, "loop_profit_tracker");
  try {
    // Print the next task that will be executed, if it exists
    const task = engine.getNextTask();
    if (task) {
      print(`Next: ${task.name}`, "blue");
    }
  } finally {
    engine.destruct();
  }
}

function jobsDone(): boolean {
  return get("_monsterHabitatsFightsLeft") === 0 && get("_monsterHabitatsRecalled") === 3;
}
