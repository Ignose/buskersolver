import { getBestFreeFight } from "./lib";
import { Quest } from "./task";
import { $effect, $familiar, $item, $location, $monster, $skill, Macro, get, have } from "libram";
import { CombatStrategy } from "grimoire-kolmafia";

const setupDone =
  have($item`Waffle`) &&
  have($effect`Feeling Fancy`) &&
  get("_monsterHabitatsMonster") === getBestFreeFight() &&
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
            .if_(getBestFreeFight(), freeMonsterThingDo)
            .if_(
              $monster`Eldritch Tentacle`,
              Macro.trySkill($skill`Emit Matter Duplicating Drones`).attack()
            )
            .attack()
        ),
        outfit: () => ({
          weapon: $item`June Cleaver`,
          offhand: $item`Can of Mixed Everything`,
          pants: $item`Designer Sweatpants`,
          familiar:
            get("gooseDronesRemaining") <= 2 ? $familiar`Grey Goose` : $familiar`CookBookBat`,
          famequip: $item`tiny rake`,
          acc1: $item`Mafia Thumb Ring`,
          acc2: $item`Lucky Gold Ring`,
          acc3: $item`Spring Shoes`,
        }),
      },
    ],
  };
}
