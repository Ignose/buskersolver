import { Monster, availableAmount, getProperty, mallPrice, print, toInt } from "kolmafia";
import { $familiar, $item, $monster, get, have, maxBy } from "libram";

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
  return { monster, value };
}

export function sim(): void {
  const dropValue = getBestFreeFightMonster().value;
  const trainsetValue = dropValue * 1.25;
  const goosoValue = have($familiar`Grey Goose`) ? 2 : 1;
  const batValue = have($familiar`CookBookBat`) ? mallPrice($item`Yeast of Boris`) / 11 / 3 : 0;
  const monsterValue = dropValue * goosoValue + trainsetValue + batValue;
  const wafflePrice = mallPrice($item`waffle`);
  const expectedProfit = monsterValue - wafflePrice;
  const opportunityCost =
    get("valueOfAdventure") * toInt(getProperty("garbo_embezzlerMultiplier")) * 15;
  const worthIt = expectedProfit * 160 - opportunityCost;
  const doIt = worthIt > 0 ? "" : "not";

  print(`Your expected profit per waffle is ${expectedProfit}`);
  print(`In theory, this is worth ${worthIt} relative to KGEs. You should ${doIt} do it.`);
}
