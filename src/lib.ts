import { Monster, availableAmount, getProperty, mallPrice, print, toInt } from "kolmafia";
import { $item, $monster, get, have, maxBy } from "libram";

type FreeFight = {
  monster: Monster;
  value: number;
};

const freeFightsToCheck: FreeFight[] = [
  { monster: $monster`Witchess Knight`, value: mallPrice($item`Jumping Horseradish`) },
  { monster: $monster`Witchess Pawn`, value: mallPrice($item`armored prawn`) },
  { monster: $monster`Witchess Bishop`, value: mallPrice($item`Sacramento Wine`) },
  { monster: $monster`Witchess Rook`, value: mallPrice($item`Greek Fire`) },
];

export function getBestFreeFightMonster(): { monster: Monster; value: number } {
  const bestFight: FreeFight = maxBy(freeFightsToCheck, "value");
  const { monster, value } = bestFight;

  print(`Chosen Monster is ${monster} with value ${value}`);
  return { monster, value };
}

export function buyWaffles(): boolean {
  const bestFreeFightMonster = getBestFreeFightMonster();
  const bestFreeFightValue = bestFreeFightMonster.value;

  print(`Cheapest waffle is ${mallPrice($item`waffle`)}`);
  return mallPrice($item`waffle`) < bestFreeFightValue * 2 + 2000;
}

export function checkProfit(): boolean {
  const bestFreeFightMonster = getBestFreeFightMonster();
  const bestFreeFightValue = bestFreeFightMonster.value;

  return (
    get("valueOfAdventure") * toInt(getProperty("garbo_embezzlerMultiplier")) <
    availableAmount($item`waffle`) * bestFreeFightMonster.value
  );
}
