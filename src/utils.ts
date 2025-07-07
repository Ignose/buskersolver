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
import {
  $effect,
  $familiar,
  $item,
  $modifier,
  $skill,
  $slot,
  get,
  have,
  NumericModifier,
  sum,
} from "libram";
import { args, checkhatrack, othermodifiers } from "./main";
import { EffectValuer, scoreBusk } from "./utils2";

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

export function printBuskResult(
  result: BuskResult | null,
  modifiers: Modifier[],
  desiredEffects: Effect[] = []
): void {
  if (!result) {
    print("No result found.");
    return;
  }

  print("\nBusk Info:");

  // Sort by busk index ascending
  const bestBusks = result.busks.sort((a, b) => a.buskIndex - b.buskIndex);

  // Define a set of other useful modifiers to show if args.othermodifiers is true
  const otherModifiersList = [
    $modifier`Item Drop`,
    $modifier`Meat Drop`,
    $modifier`Familiar Weight`,
    $modifier`Familiar Experience`,
  ];

  for (const { effects, daRaw, buskIndex } of bestBusks) {
    const desiredMatches = effects.filter((e) => desiredEffects.includes(e));
    print(`Power ${daRaw} Busk ${buskIndex + 1}`);

    // Calculate total buff per weighted modifier
    const weightedTotals = new Map<Modifier, number>();
    for (const mod of modifiers) {
      const total = sum(effects, (ef) => numericModifier(ef, mod));
      weightedTotals.set(mod, total);
    }

    if (desiredEffects.length > 0) {
      print(
        `Desired Effect Matches: ${
          desiredMatches.length > 0 ? desiredMatches.map((e) => e.name).join(", ") : "None"
        }`
      );
    }

    // Print total buffs summary line
    const totalBuffsStr = Array.from(weightedTotals.entries())
      .map(([mod, total]) => `${mod.name}: ${total}`)
      .join(", ");
    print(`Total buffs: ${totalBuffsStr}`);

    // For each weighted modifier, print contributing effects
    for (const mod of modifiers) {
      const contributingEffects = effects.filter((e) => numericModifier(e, mod) > 0);
      if (contributingEffects.length === 0) continue;

      print(`${mod.name}:`);
      print(`Useful Effects: ${contributingEffects.map((e) => e.name).join(", ")}`);
    }

    // Optionally print other useful modifiers if args.othermodifiers is true
    if (othermodifiers) {
      const otherMods = otherModifiersList.filter((mod) => !modifiers.includes(mod));
      if (otherMods.length > 0) {
        print(`Other Useful Modifiers:`);
        for (const mod of otherMods) {
          const total = sum(effects, (ef) => numericModifier(ef, mod));
          if (total > 0) {
            print(`  ${mod.name}: ${total}`);
          }
        }
      }
    }
    const usefulEffects = effects.filter((e) =>
      modifiers.some((mod) => numericModifier(e, mod) > 0)
    );
    const otherEffects = effects.filter(
      (e) => !desiredEffects.includes(e) && !usefulEffects.includes(e)
    );
    if (otherEffects.length > 0) {
      print(`Other Effects: ${otherEffects.map((e) => e.name).join(", ")}`);
    }

    print(""); // Blank line between busks
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
const allHats = () =>
  have($familiar`Mad Hatrack`) || checkhatrack
    ? allItems.filter((i) => toSlot(i) === $slot`hat`)
    : [beret];
const allPants = allItems.filter((i) => toSlot(i) === $slot`pants`);
const allShirts = allItems.filter((i) => toSlot(i) === $slot`shirt`);

export function printOutfit(hat?: Item, shirt?: Item, pants?: Item): void {
  print(
    `  - Equipment: Hat = ${hat?.name ?? "?"}, Shirt = ${shirt?.name ?? "?"}, Pants = ${
      pants?.name ?? "?"
    }`
  );
}

export function printDesiredEffectsResult(
  powers: number[],
  desiredEffects: Effect[],
  buskStartIndex = get("_beretBuskingUses", 0)
): void {
  for (let i = 0; i < powers.length; i++) {
    const power = powers[i];
    const buskIndex = buskStartIndex + i;

    const rawEffects = beretBuskingEffects(power, buskIndex);
    const buskEffects = Object.entries(rawEffects)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([name, dur]) => toEffect(name))
      .filter((e) => e !== $effect.none);

    const match = buskEffects.some((e) => desiredEffects.includes(e));
    if (!match) continue;

    const { hat, shirt, pants } = reconstructOutfit(power);
    print(`Power ${power} Busk ${buskIndex + 1}`);
    printOutfit(hat, shirt, pants);
    print(""); // spacing
  }
}

export function hybridEffectValuer(
  desiredEffects: Effect[],
  weightedModifiers: Partial<Record<NumericModifier, number>>
): (effect: Effect, duration: number, all?: [Effect, number][]) => number {
  const wantedSet = new Set(desiredEffects);
  return (effect, duration) => {
    if (wantedSet.has(effect)) {
      // Strongly prioritize desired effects
      return 1e6 + duration; // Big constant ensures it's preferred
    }
    return sum(
      Object.entries(weightedModifiers),
      ([mod, weight]) => weight * numericModifier(effect, mod)
    );
  };
}

export function normalizeEffectValuer(
  valuer: EffectValuer
): (effect: Effect, duration: number, all?: [Effect, number][]) => number {
  if (typeof valuer === "function") {
    // Upgrade function to accept optional all[] argument
    return (effect, duration) => valuer(effect, duration);
  } else if (Array.isArray(valuer)) {
    const set = new Set(valuer);
    return (effect, duration) => (set.has(effect) ? duration : 0);
  } else {
    // valuer is a weighted modifier object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (effect, _duration) =>
      sum(
        Object.entries(valuer),
        ([modifier, weight]) => weight * numericModifier(effect, modifier)
      );
  }
}
