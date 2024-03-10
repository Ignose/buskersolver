import {
  eat,
  fullnessLimit,
  inebrietyLimit,
  myAdventures,
  myFullness,
  myInebriety,
  retrieveItem,
  use,
} from "kolmafia";
import { buyWaffles, checkProfit, getBestFreeFight } from "./lib";
import { Quest } from "./task";
import { $effect, $familiar, $item, $skill, CombatLoversLocket, Macro, get, have } from "libram";
import { CombatStrategy } from "grimoire-kolmafia";

const setupDone =
  have($item`Waffle`) &&
  have($effect`Feeling Fancy`) &&
  get("_monsterHabitatsMonster") === getBestFreeFight() &&
  have($effect`Eldritch Attunement`);

export function DoSetup(): Quest {
  return {
    name: "Let's set everything up",
    ready: () => buyWaffles(),
    completed: () => myAdventures() === 0 || myInebriety() > inebrietyLimit() || setupDone,
    tasks: [
      {
        name: "Buy Waffles",
        completed: () => !buyWaffles() || have($item`Waffle`, 100),
        do: (): void => {
          while (buyWaffles()) {
            retrieveItem($item`waffle`, 1);
          }
        },
        limit: { tries: 1 },
      },
      {
        name: "LGR Seed",
        completed: () =>
          !have($item`lucky gold ring`) || get("_stenchAirportToday") || get("stenchAirportAlways"),
        do: () => use($item`one-day ticket to Dinseylandfill`),
      },
      {
        name: "Acquire Familiar XP",
        completed: () => have($effect`Feeling Fancy`) || myFullness() + 2 >= fullnessLimit(),
        do: (): void => {
          retrieveItem($item`Roasted vegetable focaccia`);
          eat($item`Roasted vegetable focaccia`);
        },
        limit: { tries: 1 },
      },
      {
        name: "Grab a free fight",
        ready: () => have($effect`Feeling Fancy`),
        completed: () =>
          checkProfit() ||
          !have($item`waffle`) ||
          get("_monsterHabitatsRecalled") >= 3 ||
          (get("_monsterHabitatsMonster") === getBestFreeFight() &&
            get("_monsterHabitatsFightsLeft") > 0),
        do: (): void => {
          CombatLoversLocket.reminisce(getBestFreeFight());
        },
        combat: new CombatStrategy().macro(
          Macro.trySkill($skill`Recall Facts: Monster Habitats`)
            .trySkill($skill`Emit Matter Duplicating Drones`)
            .trySkillRepeat($skill`Lunging Thrust-Smack`)
        ),
        outfit: () => ({
          weapon: $item`June Cleaver`,
          familiar: $familiar`Grey Goose`,
          acc1: $item`Lucky Gold Ring`,
          acc2: $item`Mafia Thumb Ring`,
          acc3: $item`Spring Shoes`,
        }),
        limit: { tries: 1 },
      },
      {
        name: "Finish Buffing Up",
        ready: () => get("_monsterHabitatsMonster") === getBestFreeFight(),
        completed: () => have($effect`Eldritch Attunement`),
        do: (): void => {
          retrieveItem($item`eldritch mushroom pizza`);
          eat($item`eldritch mushroom pizza`);
        },
        limit: { tries: 1 },
      },
    ],
  };
}
