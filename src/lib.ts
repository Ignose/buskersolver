import {
  Item,
  Monster,
  availableAmount,
  fullnessLimit,
  getProperty,
  mallPrice,
  myFullness,
  myMeat,
  toInt,
} from "kolmafia";
import { $familiar, $item, $monster, $skill, get, have } from "libram";

const freeFightsToCheck = new Map([
  [$monster`Witchess Knight`, mallPrice($item`Jumping Horseradish`)],
  [$monster`Witchess Pawn`, mallPrice($item`armored prawn`)],
  [$monster`Witchess Bishop`, mallPrice($item`Sacramento Wine`)],
  [$monster`Witchess Rook`, mallPrice($item`Greek Fire`)],
]);

export function getBestFreeFightValue(): number {
  let maxMonster: Monster | null = null;
  let maxValue = -1;

  for (const [monster, value] of freeFightsToCheck) {
    if (value > maxValue) {
      maxValue = value;
      maxMonster = monster;
    }
  }

  if (have($familiar`Grey Goose`)) maxValue = maxValue * 2;
  return maxValue;
}

export function getBestFreeFight(): Monster {
  let maxMonster: Monster = $monster`Witchess Knight`;
  let maxValue = -1;

  for (const [monster, value] of freeFightsToCheck) {
    if (value > maxValue) {
      maxValue = value;
      maxMonster = monster;
    }
  }

  return maxMonster;
}

export function buyWaffles(): boolean {
  return mallPrice($item`waffle`) < getBestFreeFightValue();
}

export function checkProfit(): boolean {
  return (
    get("valueOfAdventure") * toInt(getProperty("garbo_embezzlerMultiplier")) <
    availableAmount($item`waffle`) * getBestFreeFightValue()
  );
}

export function canRun(): boolean {
  const haveBofa =
    have($skill`Recall Facts: Monster Habitats`) &&
    get("_monsterHabitatsRecalled") < 3 &&
    get("_monsterHabitatsFightsLeft") === 0;
  const haveSpringShoes = have($item`Spring Shoes`);
  const haveGooso = have($familiar`Grey Goose`);
  const haveOrgans = myFullness() + 5 <= fullnessLimit();
  const canInvest = myMeat() >= 5000000;

  return haveBofa && haveSpringShoes && haveGooso && haveOrgans && canInvest;
}
