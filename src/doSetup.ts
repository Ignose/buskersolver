import { eat, fullnessLimit, myFullness, print, restoreMp, retrieveItem, use } from "kolmafia";
import { buyWaffles, checkProfit, getBestFreeFightMonster } from "./lib";
import { Quest } from "./task";
import {
  $effect,
  $item,
  $location,
  $monster,
  $skill,
  CombatLoversLocket,
  Macro,
  get,
  have,
} from "libram";
import { CombatStrategy } from "grimoire-kolmafia";
import { baseOutfit } from "./outfit";

function setupDone(): boolean {
  if (
    have($item`Waffle`) &&
    have($effect`Feeling Fancy`) &&
    get("_monsterHabitatsMonster") === getBestFreeFightMonster().monster &&
    have($effect`Eldritch Attunement`)
  )
    return true;
  return false;
}

export function DoSetup(): Quest {
  return {
    name: "Let's set everything up",
    completed: () => setupDone() && have($item`waffle`, 100),
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
        completed: () => get("_stenchAirportToday") || get("stenchAirportAlways"),
        do: (): void => {
          if (!have($item`one-day ticket to Dinseylandfill`))
            retrieveItem($item`one-day ticket to Dinseylandfill`);
          use($item`one-day ticket to Dinseylandfill`);
        },
        limit: { tries: 1 },
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
        name: "Sniff and Run",
        prepare: () => restoreMp(200),
        completed: () => get("olfactedMonster") === $monster`Crate`,
        do: $location`Noob Cave`,
        combat: new CombatStrategy().macro(
          Macro.trySkill($skill`Transcendent Olfaction`)
            .trySkill($skill`Gallapagosian Mating Call`)
            .trySkill($skill`Offer Latte to Opponent`)
            .trySkill($skill`Emit Matter Duplicating Drones`)
            .trySkill($skill`Spring Away`)
        ),
        outfit: baseOutfit(true),
        limit: { tries: 1 },
      },
      {
        name: "Grab a free fight",
        ready: () => have($effect`Feeling Fancy`),
        completed: () =>
          checkProfit() ||
          !have($item`waffle`) ||
          get("_monsterHabitatsRecalled") >= 3 ||
          (get("_monsterHabitatsMonster") === getBestFreeFightMonster().monster &&
            get("_monsterHabitatsFightsLeft") > 0),
        do: (): void => {
          CombatLoversLocket.reminisce(getBestFreeFightMonster().monster);
        },
        combat: new CombatStrategy().macro(
          Macro.trySkill($skill`Recall Facts: Monster Habitats`)
            .trySkill($skill`Emit Matter Duplicating Drones`)
            .trySkillRepeat($skill`Lunging Thrust-Smack`)
        ),
        outfit: baseOutfit(false),
        limit: { tries: 1 },
      },
      {
        name: "Finish Buffing Up",
        ready: () => get("_monsterHabitatsMonster") === getBestFreeFightMonster().monster,
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
