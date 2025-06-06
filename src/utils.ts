import {
  beretBuskingEffects,
  Effect,
  getPower,
  Item,
  Modifier,
  numericModifier,
  print,
  toEffect,
  toInt,
  toSlot,
} from "kolmafia";
import { $familiar, $item, $skill, $slot, clamp, get, have, sum } from "libram";
import { args } from "./main";

export interface Busk {
  effects: Effect[];
  score: number;
  buskIndex: number;
  daRaw: number;
}

export interface BuskResult {
  score: number;
  busks: Busk[];
}

// eslint-disable-next-line libram/verify-constants
const beret = $item`prismatic beret`;
const taoMultiplier = have($skill`Tao of the Terrapin`) ? 2 : 1;

function scoreBusk(
  effects: Effect[],
  weightedModifiers: [Modifier, number][],
  uselessEffects: Effect[]
): number {
  const usefulEffects = effects.filter((ef) => !uselessEffects.includes(ef));

  return sum(
    weightedModifiers,
    ([modifier, weight]) => weight * sum(usefulEffects, (ef) => numericModifier(ef, modifier))
  );
}

export function findTopBusksFast(
  weightedModifiers: [Modifier, number][],
  uselessEffects: Effect[]
): BuskResult | null {
  const BUSKNUM = args.allbusks ? 5 : clamp(5 - toInt(get("_beretBuskingUses")), 0, 5);
  const startBuskIndex = 5 - BUSKNUM;
  const allBusks = beretDASum.flatMap((daRaw) => {
    return Array(BUSKNUM)
      .fill(null)
      .map((_, i) => {
        const buskIndex = startBuskIndex + i;
        const rawEffects = beretBuskingEffects(daRaw, buskIndex);
        const effects: Effect[] = Array.from(
          new Set(
            Object.keys(rawEffects)
              .map((name) => {
                try {
                  return toEffect(name);
                } catch {
                  print(`Invalid effect name: ${name}`, "red");
                  return null;
                }
              })
              .filter((e): e is Effect => e !== null)
          )
        );
        const score = scoreBusk(effects, weightedModifiers, uselessEffects);
        return { daRaw, effects, score, buskIndex };
      });
  });

  const bestBusksByIndex = new Map<number, Busk>();
  for (const busk of allBusks) {
    const existing = bestBusksByIndex.get(busk.buskIndex);
    if (!existing || busk.score > existing.score) {
      bestBusksByIndex.set(busk.buskIndex, busk);
    }
  }

  const topBusks = Array.from(bestBusksByIndex.values());

  const totalScore = sum(topBusks, "score");
  return { score: totalScore, busks: topBusks };
}

function reconstructOutfit(daRaw: number): { hat?: Item; shirt?: Item; pants?: Item } {
  for (const hat of allHats) {
    const hatPower = have($skill`Tao of the Terrapin`)
      ? taoMultiplier * getPower(hat)
      : getPower(hat);
    for (const shirt of allShirts) {
      const shirtPower = getPower(shirt);
      for (const pants of allPants) {
        const pantsPower = have($skill`Tao of the Terrapin`)
          ? taoMultiplier * getPower(pants)
          : getPower(pants);
        if (shirtPower + hatPower + pantsPower === daRaw) {
          return { hat, shirt, pants };
        }
      }
    }
  }

  return {};
}

export function printBuskResult(result: BuskResult | null, modifiers: Modifier[]): void {
  if (!result) {
    print("No result found.");
    return;
  }

  print(`Score: ${result.score}`);
  print("\nBusk Info:");

  const bestBusksByIndex = new Map<number, Busk>();
  for (const busk of result.busks) {
    const existing = bestBusksByIndex.get(busk.buskIndex);
    if (!existing || busk.score > existing.score) {
      bestBusksByIndex.set(busk.buskIndex, busk);
    }
  }

  const bestBusks = Array.from(bestBusksByIndex.values()).sort((a, b) => a.buskIndex - b.buskIndex);

  for (const { effects, daRaw, buskIndex } of bestBusks) {
    const effectNames = effects.map((e) => e.name).join(", ");
    const modifierValues = modifiers
      .map((mod) => {
        const total = sum(effects, (ef) => numericModifier(ef, mod));
        return `${mod.name}: ${total}`;
      })
      .join(", ");
    print(`Power ${daRaw} Busk ${buskIndex + 1}, Effects: ${effectNames}, ${modifierValues}`);

    const { hat, shirt, pants } = reconstructOutfit(daRaw);
    print(
      `  - Equipment: Hat = ${hat?.name ?? "?"}, Shirt = ${shirt?.name ?? "?"}, Pants = ${
        pants?.name ?? "?"
      }`
    );
    print("    ");
  }
}

// Equipment setup
const allItems = Item.all().filter((i) => have(i));
const allHats = have($familiar`Mad Hatrack`)
  ? allItems.filter((i) => toSlot(i) === $slot`hat`)
  : [beret];
const allPants = allItems.filter((i) => toSlot(i) === $slot`pants`);
const allShirts = allItems.filter((i) => toSlot(i) === $slot`shirt`);

const hats = [...new Set(allHats.map((i) => taoMultiplier * getPower(i)))];

const pants = [...new Set(allPants.map((i) => taoMultiplier * getPower(i)))];
const shirts = [...new Set(allShirts.map((i) => getPower(i)))];

export const beretDASum = [
  ...new Set(
    hats.flatMap((hat) => pants.flatMap((pant) => shirts.flatMap((shirt) => hat + pant + shirt)))
  ),
];
