import {
  beretBuskingEffects,
  canEquip,
  Effect,
  getPower,
  Item,
  Modifier,
  npcPrice,
  numericModifier,
  print,
  toEffect,
  toSlot,
} from "kolmafia";
import { $effect, $familiar, $item, $skill, $slot, get, have, NumericModifier, sum } from "libram";
import { args, checkhatrack } from "./main";
import { scoreBusk } from "./utils2";

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

function multipliers(): [number, number] {
  const taoHatMultiplier = have($skill`Tao of the Terrapin`) ? 2 : 1;
  const taoPantsMultiplier = have($skill`Tao of the Terrapin`) ? 1 : 0;
  const hammerTimeMultiplier = have($effect`Hammertime`) || args.checkhammertime ? 3 : 0;
  const totalPantsMultiplier = 1 + hammerTimeMultiplier + taoPantsMultiplier;

  return [taoHatMultiplier, totalPantsMultiplier];
}

export function reconstructOutfit(daRaw: number): { hat?: Item; shirt?: Item; pants?: Item } {
  for (const hat of allHats()) {
    const hatPower = multipliers()[0] * getPower(hat);
    for (const shirt of allShirts) {
      const shirtPower = getPower(shirt);
      for (const pants of allPants) {
        const pantsPower = multipliers()[1] * getPower(pants);
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

  print("\nBusk Info:");

  const bestBusks = result.busks.sort((a, b) => a.buskIndex - b.buskIndex);

  for (const { effects, daRaw, buskIndex } of bestBusks) {
    const usefulEffects = effects.filter((e) =>
      modifiers.some((m) => numericModifier(e, m) > 0)
    );
    const otherEffects = effects.filter((e) => !usefulEffects.includes(e));

    const modifierValues = modifiers
      .map((mod) => {
        const total = sum(effects, (ef) => numericModifier(ef, mod));
        return `${mod.name}: ${total}`;
      })
      .join(", ");

    print(`Power ${daRaw} Busk ${buskIndex + 1}`);
    print(`Useful Effects: ${usefulEffects.map((e) => e.name).join(", ")}, ${modifierValues}`);
    print(`Other effects: ${otherEffects.map((e) => e.name).join(", ")}`);

    const { hat, shirt, pants } = reconstructOutfit(daRaw);
    printOutfit(hat, shirt, pants);
    print("");
  }
}


export function makeBuskResultFromPowers(
  powers: number[],
  weightedModifiers: Partial<Record<NumericModifier, number>>,
  uselessEffects: Effect[],
  buskStartIndex = get("_beretBuskingUses", 0)
): BuskResult {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const effectValuer = (effect: Effect, _duration: number) =>
    Object.entries(weightedModifiers)
      .map(([mod, weight]) => (weight ?? 0) * numericModifier(effect, mod))
      .reduce((a, b) => a + b, 0);

  const busks: Busk[] = powers.map((power, index) => {
    const buskIndex = buskStartIndex + index;
    const rawEffects = beretBuskingEffects(power, buskIndex);

    const effectTuples: [Effect, number][] = Object.entries(rawEffects)
      .map(([name, dur]): [Effect, number] => [toEffect(name), dur])
      .filter(([e]) => e !== $effect.none);

    const effects = effectTuples.map(([e]) => e); // strip durations
    const score = scoreBusk(effectTuples, effectValuer, new Set(uselessEffects));

    return { daRaw: power, effects, score, buskIndex };
  });

  return {
    busks,
    score: sum(busks, (b) => b.score),
  };
}

const allItems = Item.all().filter((i) => have(i) && canEquip(i));
const shopItems = Item.all().filter((i) => npcPrice(i) > 0 && canEquip(i));
allItems.push(...shopItems);
const allHats = () => have($familiar`Mad Hatrack`) || checkhatrack
  ? allItems.filter((i) => toSlot(i) === $slot`hat`)
  : [beret];
const allPants = allItems.filter((i) => toSlot(i) === $slot`pants`);
const allShirts = allItems.filter((i) => toSlot(i) === $slot`shirt`);

export function printOutfit(hat?: Item, shirt?: Item, pants?: Item): void {
  print(`  - Equipment: Hat = ${hat?.name ?? "?"}, Shirt = ${shirt?.name ?? "?"}, Pants = ${pants?.name ?? "?"}`);
}
