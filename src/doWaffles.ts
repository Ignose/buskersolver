import {
  eat,
  fullnessLimit,
  getWorkshed,
  mallPrice,
  myFullness,
  print,
  restoreMp,
  retrieveItem,
  use,
  visitUrl,
} from "kolmafia";
import { getBestFreeFightMonster } from "./lib";
import {
  $effect,
  $item,
  $location,
  $monster,
  $skill,
  CombatLoversLocket,
  Macro,
  TrainSet,
  get,
  have,
} from "libram";
import { CombatStrategy } from "grimoire-kolmafia";
import { baseOutfit } from "./outfit";
import { Quest } from "./engine";
import { Cycle, Station, setConfiguration } from "libram/dist/resources/2022/TrainSet";

const stations = [
  Station.COAL_HOPPER, // double mainstat gain
  Station.TRACKSIDE_DINER, // main stats
  Station.VIEWING_PLATFORM, // all stats
  Station.GAIN_MEAT, // meat
  Station.TOWER_FIZZY, // mp regen
  Station.BRAIN_SILO, // myst stats
  Station.WATER_BRIDGE, // +ML
  Station.CANDY_FACTORY, // candies
] as Cycle;

const bestFreeFightMonster = getBestFreeFightMonster();

function buyWaffles(): boolean {
  const bestFreeFightValue = bestFreeFightMonster.value;

  print(`Cheapest waffle is ${mallPrice($item`waffle`)}`);
  return mallPrice($item`waffle`) < bestFreeFightValue * 2 + 2000;
}

function setupDone(): boolean {
  return (
    have($item`Waffle`) &&
    have($effect`Feeling Fancy`) &&
    get("_monsterHabitatsMonster") === getBestFreeFightMonster().monster &&
    have($effect`Eldritch Attunement`)
  );
}

const freeMonsterThingDo =
  get("_monsterHabitatsFightsLeft") === 0 && get("_monsterHabitatsRecalled") < 3
    ? Macro.trySkill($skill`Recall Facts: Monster Habitats`)
    : Macro.attack();

export function DoWaffles(): Quest {
  return {
    name: "Wafflo",
    completed: () =>
      !have($item`Waffle`) ||
      (get("_monsterHabitatsFightsLeft") === 0 && get("_monsterHabitatsRecalled") === 3),
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
        name: "Configure Trainset Early",
        ready: () => getWorkshed() === $item`model train set` && TrainSet.canConfigure() === true,
        completed: () =>
          TrainSet.canConfigure() === false || TrainSet.cycle().toString === stations.toString,
        do: (): void => {
          const offset = get("trainsetPosition") % 8;
          const newStations: TrainSet.Station[] = [];
          const stations = [
            Station.COAL_HOPPER, // double food drop
            Station.TRACKSIDE_DINER,
            Station.VIEWING_PLATFORM, // all stats
            Station.GAIN_MEAT, // meat
            Station.TOWER_FIZZY, // mp regen
            Station.BRAIN_SILO, // myst stats
            Station.WATER_BRIDGE, // +ML
            Station.CANDY_FACTORY, // candies
          ] as Cycle;
          for (let i = 0; i < 8; i++) {
            const newPos = (i + offset) % 8;
            newStations[newPos] = stations[i];
          }
          visitUrl("campground.php?action=workshed");
          visitUrl("main.php");
          setConfiguration(newStations as Cycle);
        },
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
      {
        name: "Do Them Fights",
        ready: () => setupDone(),
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
