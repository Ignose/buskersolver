import {
  beretBuskingEffects,
  buy,
  canEquip,
  Effect,
  getPower,
  haveEquipped,
  Item,
  Modifier,
  myMeat,
  npcPrice,
  numericModifier,
  print,
  Slot,
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
  have as have_,
  logger,
  maxBy,
  NumericModifier,
  sum,
} from "libram";
import { checkhatrack, hammertime, inHatPath, othermodifiers } from "./main";

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

const hatTrickHats = inHatPath ? Item.all().filter((i) => toSlot(i) === $slot`Hat` && haveEquipped(i)) : [];
const pathHatPower = hatTrickHats.length > 1
    ? hatTrickHats.reduce((total, hat) => total + getPower(hat), 0) * multipliers($slot`hat`)
    : 0;

// eslint-disable-next-line libram/verify-constants
const beret = $item`prismatic beret`;

function multipliers(slot: Slot): number {
  const taoMultiplier = have_($skill`Tao of the Terrapin`) ? 2 : 1;
  const hammertimeMultiplier = have_($effect`Hammertime`) || hammertime ? 3 : 0;

  return slot === $slot`Shirt`
    ? 1
    : slot === $slot`Hat`
    ? taoMultiplier
    : slot === $slot`Pants`
    ? taoMultiplier + hammertimeMultiplier
    : 0;
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

    const bestOutfit = findOutfit(daRaw, true);
    if (bestOutfit === null) {
      print("No viable outfit found, something went horribly wrong!");
    } else {
      const hat = bestOutfit.hat !== null ? bestOutfit.hat : Item.none;
      const shirt = bestOutfit.shirt !== null ? bestOutfit.shirt : Item.none;
      const pants = bestOutfit.pants !== null ? bestOutfit.pants : Item.none;

      print(`Outfit: Hat -  ${hat},  Shirt -  ${shirt},  Pants -  ${pants}`);
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

export type EffectValuer =
  | Partial<Record<NumericModifier, number>>
  | ((effect: Effect, duration: number) => number)
  | Effect[];

/**
 * @returns Whether or not you have the prismatic beret
 */
export function have(): boolean {
  return have_(beret);
}

function getUseableClothes(buyItem = true): {
  useableHats: Item[];
  useablePants: Item[];
  useableShirts: Item[];
} {
  const availableItems = Item.all().filter(
    (i) => canEquip(i) && (have_(i) || (buyItem && npcPrice(i) > 0))
  );
  const useableHats =
    have_($familiar`Mad Hatrack`) || checkhatrack
      ? [...availableItems.filter((i) => toSlot(i) === $slot`hat` && (inHatPath ? !haveEquipped(i) : true)), $item.none]
      : [beret];
  const useablePants = [...availableItems.filter((i) => toSlot(i) === $slot`pants`), $item.none];
  const useableShirts = [...availableItems.filter((i) => toSlot(i) === $slot`shirt`), $item.none];
  return { useableHats, useablePants, useableShirts };
}

function availablePowersums(buyItem: boolean): number[] {
  const { useableHats, useablePants, useableShirts } = getUseableClothes(buyItem);

  const hatPowers = [...new Set(useableHats.map((i) => multipliers($slot`Hat`) * getPower(i)))];
  const pantPowers = [...new Set(useablePants.map((i) => multipliers($slot`Pants`) * getPower(i)))];
  const shirtPowers = [...new Set(useableShirts.map((i) => getPower(i)))];

  return [
    ...new Set(
      hatPowers.flatMap((hat) =>
        pantPowers.flatMap((pant) => shirtPowers.flatMap((shirt) => hat + pant + shirt))
      )
    ),
  ];
}

export function scoreBusk(
  effects: [Effect, number][],
  effectValuer: (effect: Effect, duration: number, all?: [Effect, number][]) => number,
  uselessEffects: Set<Effect>
): number {
  const useful = effects.filter(([e]) => !uselessEffects.has(e));
  return sum(useful, ([e, dur]) => effectValuer(e, dur, effects));
}

/**
 * Calculate the optimal power-sum at which to busk, given a weighted set of modifiers.
 * @param wantedEffects An array of Effects we care about; maximizes the number of those effects we end up with
 * @param buskUses How many busks should we assume we've cast? Defaults to the current number.
 * @param uselessEffects An array (defaults to empty) of effects not to consider for the purposes of busk valuation
 * @param buyItem Whether or not we should consider purchasing items from NPC stores; defaults to true
 * @returns The power-sum at which you'll find the optimal busk for this situation.
 */
export function findOptimalOutfitPower(
  wantedEffects: Effect[],
  buskUses?: number,
  uselessEffects?: Effect[],
  buyItem?: boolean
): number;
/**
 * Calculate the optimal power-sum at which to busk, given a weighted set of modifiers.
 * @param weightedModifiers An object keyed by Numeric Modifiers, with their values representing weights
 * @param buskUses How many busks should we assume we've cast? Defaults to the current number.
 * @param uselessEffects An array (defaults to empty) of effects not to consider for the purposes of busk valuation
 * @param buyItem Whether or not we should consider purchasing items from NPC stores; defaults to true
 * @returns The power-sum at which you'll find the optimal busk for this situation.
 */
export function findOptimalOutfitPower(
  weightedModifiers: Partial<Record<NumericModifier, number>>,
  buskUses?: number,
  uselessEffects?: Effect[],
  buyItem?: boolean
): number;
/**
 * Calculate the optimal power-sum at which to busk, given a weighted set of modifiers.
 * @param valueFunction A function that maps effects to values
 * @param buskUses How many busks should we assume we've cast? Defaults to the current number.
 * @param uselessEffects An array (defaults to empty) of effects not to consider for the purposes of busk valuation
 * @param buyItem Whether or not we should consider purchasing items from NPC stores; defaults to true
 * @returns The power-sum at which you'll find the optimal busk for this situation.
 */
export function findOptimalOutfitPower(
  valueFunction: (effect: Effect, duration: number) => number,
  buskUses?: number,
  uselessEffects?: Effect[],
  buyItem?: boolean
): number;
/**
 * Calculate the optimal power-sum at which to busk, given a weighted set of modifiers.
 * @param effectValuer Either a function that maps effect-duration pairs to values, or an object keyed by numeric modifiers with weights as values, or an array of desired effects
 * @param buskUses How many busks should we assume we've cast? Defaults to the current number.
 * @param uselessEffects An array (defaults to empty) of effects not to consider for the purposes of busk valuation
 * @param buyItem Whether or not we should consider purchasing items from NPC stores; defaults to true
 * @returns The power-sum at which you'll find the optimal busk for this situation.
 */
export function findOptimalOutfitPower(
  effectValuer: EffectValuer,
  buskUses?: number,
  uselessEffects?: Effect[],
  buyItem?: boolean
): number;
/**
 * Calculate the optimal power-sum at which to busk, given a weighted set of modifiers.
 * @param effectValuer Either a function that maps effect-duration pairs to values, or an object keyed by numeric modifiers with weights as values, or an array of desired effects
 * @param buskUses How many busks should we assume we've cast? Defaults to the current number.
 * @param uselessEffects An array (defaults to empty) of effects not to consider for the purposes of busk valuation
 * @param buyItem Whether or not we should consider purchasing items from NPC stores; defaults to true
 * @returns The power-sum at which you'll find the optimal busk for this situation.
 */
export function findOptimalOutfitPower(
  effectValuer: EffectValuer,
  buskUses = get("_beretBuskingUses", 0),
  uselessEffects: Effect[] = [],
  buyItem = true
): number {
  const valuerFn = normalizeEffectValuer(effectValuer);
  const uselessEffectSet = new Set(uselessEffects);
  const powersums = availablePowersums(buyItem);
  if (!powersums.length) return 0;
  return maxBy(powersums, (power) =>
    scoreBusk(
      Object.entries(beretBuskingEffects(power, buskUses))
        .map(([effect, duration]): [Effect, number] => [toEffect(effect), duration])
        .filter(([e]) => e !== $effect.none),
      valuerFn,
      uselessEffectSet
    )
  );
}

const populateMap = (arr: Item[], max: number, double: number) => {
  const map = new Map<number, Item>();
  for (const it of arr) {
    const power = getPower(it) * double;
    if (power > max) continue;

    const existing = map.get(power);
    if (!existing || (!have_(existing) && (have_(it) || npcPrice(it) < npcPrice(existing)))) {
      map.set(power, it);
    }
  }
  return map;
};
const relevantSlots = ["hat", "pants", "shirt"] as const;
const functionalPrice = (item: Item) => (have_(item) || item === Item.none ? 0 : npcPrice(item));
const outfitPrice = (outfit: { hat: Item; pants: Item; shirt: Item }) =>
  sum(relevantSlots, (slot) => functionalPrice(outfit[slot]));

export function findOutfit(power: number, buyItem: boolean) {
  const { useableHats, useablePants, useableShirts } = getUseableClothes(buyItem);
  const hatPowers = populateMap(useableHats, power, multipliers($slot`Hat`));
  const pantsPowers = populateMap(useablePants, power, multipliers($slot`Pants`));
  const shirtPowers = populateMap(useableShirts, power, multipliers($slot`Shirt`));

  const outfits = [...hatPowers].flatMap(([hatPower, hat]) =>
    [...pantsPowers].flatMap(([pantsPower, pants]) =>
      [...shirtPowers].flatMap(([shirtPower, shirt]) =>
        hatPower + pantsPower + shirtPower + pathHatPower === power ? { hat, pants, shirt } : []
      )
    )
  );
  if (!outfits.length) return null;
  const outfit = maxBy(outfits, outfitPrice, true);
  logger.debug(`Chose outfit ${outfit.hat} ${outfit.shirt} ${outfit.pants}`);
  if (outfitPrice(outfit) > myMeat()) return null;

  for (const slot of relevantSlots) {
    const item = outfit[slot];
    if (item === Item.none) continue;
    if (have_(item)) continue;
    if (!buy(item)) {
      logger.debug(`Failed to purchase ${item}`);
      return null;
    }
  }
  return outfit;
}
