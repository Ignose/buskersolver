import { print } from "kolmafia";
import { Task } from "./task";
import { getTasks } from "grimoire-kolmafia";
import { Engine } from "./engine";
import { DoSetup } from "./doSetup";
import { ExecuteWaffles } from "./executeWaffles";
import { jobsDone } from "./lib";

const version = "0.0.1";

export function main(): void {
  print(`Running: wafflo v${version}`);

  const tasks: Task[] = getTasks([DoSetup(), ExecuteWaffles()]);

  const engine = new Engine(tasks);

  try {
    // Print the next task that will be executed, if it exists
    while (!jobsDone) {
      const task = engine.getNextTask();
      if (task === undefined) throw "Unable to find available task, but the run is not complete";
      engine.execute(task);
      if (task) {
        print(`Next: ${task.name}`, "blue");
      }
    }
  } finally {
    engine.destruct();
  }
}
