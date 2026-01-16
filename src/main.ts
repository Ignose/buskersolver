import { Args } from "grimoire-kolmafia";
import { sinceKolmafiaRevision } from "libram";
import { totalMeat } from "./utils";
import { print } from "kolmafia";

export const args = Args.create("isGarboForMe", "Be good, be kind", {
  test: Args.flag({
    help: `building this for use later, please ignore`,
    default: false,
  }),
});

export function main(command?: string): void {
  sinceKolmafiaRevision(28881);
  Args.fill(args, command);

  if (args.help) {
    Args.showHelp(args);
    return;
  }

  if (totalMeat() > 3450) {
    print(`You should be running Garbo!`)
  } else {
    print(`Maybe consider volcano`)
  }

}
