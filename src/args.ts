import { Args } from "grimoire-kolmafia";
import { Item, toClass } from "kolmafia";
import { $class, $classes, $item, $items, get } from "libram";

export const args = Args.create(
  "CandyWrapper",
  `Written by Seraphiii. This is a full-day wrapper for Community Service. It aims to be a single-press script that will take you through your Aftercore and Community Service legs. It chooses to perm learned skills upon ascension.`,
  {
    version: Args.flag({
      help: "Output script version number and exit.",
      default: false,
      setting: "",
    }),

    //partial run args
    actions: Args.number({
      help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
    }),
    abort: Args.string({
      help: "If given, abort during the prepare() step for the task with matching name.",
    }),
    //sim
    sim: Args.flag({
      help: "Prints out expected profit per waffle (does not consider opportunity costs)",
      default: false,
    }),
  }
);
