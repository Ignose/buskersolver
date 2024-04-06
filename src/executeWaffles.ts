import { getBestFreeFightMonster } from "./lib";
import { Quest } from "./task";
import { $effect, $familiar, $item, $location, $monster, $skill, Macro, get, have } from "libram";
import { CombatStrategy } from "grimoire-kolmafia";
import { baseOutfit } from "./outfit";

const setupDone =
  have($item`Waffle`) &&
  have($effect`Feeling Fancy`) &&
  get("_monsterHabitatsMonster") === getBestFreeFightMonster().monster &&
  have($effect`Eldritch Attunement`);
const freeMonsterThingDo =
  get("_monsterHabitatsFightsLeft") === 0 && get("_monsterHabitatsRecalled") < 3
    ? Macro.trySkill($skill`Recall Facts: Monster Habitats`)
    : Macro.attack();

export function ExecuteWaffles(): Quest {
  return {
    name: "Let's toss some waffles",
    ready: () => setupDone,
    completed: () =>
      !have($item`Waffle`) ||
      (get("_monsterHabitatsFightsLeft") === 0 && get("_monsterHabitatsRecalled") === 3),
    tasks: [
      {
        name: "Do Them Fights",
        completed: () =>
          !have($item`Waffle`) ||
          (get("_monsterHabitatsFightsLeft") === 0 && get("_monsterHabitatsRecalled") === 3),
        do: $location`Noob Cave`,
        combat: new CombatStrategy().macro(
          Macro.trySkill($skill`Emit Matter Duplicating Drones`)
            .if_($monster`crate`, Macro.tryItem($item`Waffle`))
            .if_(getBestFreeFightMonster().monster, freeMonsterThingDo)
            .if_(
              $monster`Eldritch Tentacle`,
              Macro.trySkill($skill`Emit Matter Duplicating Drones`).attack()
            )
            .attack()
        ),
        outfit: baseOutfit(false),
      },
    ],
  };
}
