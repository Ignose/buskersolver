import { Args } from "grimoire-kolmafia";
import { Effect, Modifier, print, toEffect, toModifier } from "kolmafia";
import { $effects, get, have, NumericModifier, sinceKolmafiaRevision } from "libram";
import { findOptimalOutfitPower } from "./utils2";
import {
  hybridEffectValuer,
  makeBuskResultFromPowers,
  normalizeEffectValuer,
  printBuskResult,
} from "./utils";

export const args = Args.create("Beret_Busk_Tester", "Be good, be kind", {
  modifiers: Args.string({
    help: `Numeric Modifiers to check; these can be singular like modifiers="Meat Drop", multiple like modifiers="Meat Drop, Familiar Weight" or weighted like modifiers="5 Meat Drop, 10 Familiar Weight"`,
    default: Modifier.none.name,
  }),
  effects: Args.string({
    help: `Effects that you want to prioritize, for instance effects="Salty Mouth" will look for busks that grant Salty Mouth`,
    default: Effect.none.name,
  }),
  othermodifiers: Args.flag({
    help: `Set allbusks to "true" to detail bonuses to other modifiers like Item Drop, Meat Drop, etc. even if not weighted`,
    default: false,
  }),
  uselesseffects: Args.string({
    help: `Effects that aren't helpful for you, for instance uselesseffects="Leash of Linguini, Empathy, Thoughtful Empathy"`,
    default: "",
  }),
  uniqueeffects: Args.flag({
    help: `Only value effects you don't already have`,
    default: false,
  }),
  allbusks: Args.flag({
    help: `Set allbusks to "true" to check all busk levels; default behavior is only to test available busks`,
    default: false,
  }),
  busk: Args.number({
    help: `Check a specific busk by passing a number to check (1-5)`,
  }),
  checkhammertime: Args.flag({
    help: `Pretend we have effect hammertime to widen the pants scope`,
    default: false,
  }),
  checkhatrack: Args.flag({
    help: `Pretend we have a hatrack to widen the hat scope`,
    default: false,
  }),
});

export let checkhatrack = false;
export let othermodifiers = false;
export let hammertime = false;

function parseWeightedModifiers(input: string): Partial<Record<NumericModifier, number>> {
  if (!input.trim()) return {};

  const result: Partial<Record<NumericModifier, number>> = {};
  const parts = input.split(",").map((s) => s.trim());

  for (const part of parts) {
    // Try to match weighted, e.g. "5 Meat Drop"
    const weightedMatch = part.match(/^(\d+)\s+(.+)$/);
    if (weightedMatch) {
      const weight = Number(weightedMatch[1]);
      const modifierName = weightedMatch[2].trim() as NumericModifier;
      result[modifierName] = weight;
    } else {
      // Default weight 1 for singular modifier e.g. "Meat Drop"
      result[part as NumericModifier] = 1;
    }
  }
  return result;
}

function parseEffects(input: string): Effect[] {
  const effectList = input
    .split(",")
    .map((entry) => toEffect(entry.trim()))
    .filter((e): e is Effect => e !== null); // Remove invalid entries
  return effectList.length > 0 ? effectList : $effects``;
}

export function main(command?: string): void {
  sinceKolmafiaRevision(28549);
  Args.fill(args, command);

  if (args.help) {
    Args.showHelp(args);
    return;
  }
  if (args.checkhatrack) {
    checkhatrack = true;
  }

  if (args.checkhammertime) {
    hammertime = true;
  }

  if (args.othermodifiers) {
    othermodifiers = true;
  }

  const uselesseffects = parseEffects(args.uselesseffects);
  if (args.uniqueeffects) {
    uselesseffects.push(...Effect.all().filter((e) => have(e)));
  }

  const startUses = args.allbusks ? 0 : get("_beretBuskingUses", 0);
  const buskRange =
    args.busk !== undefined
      ? [args.busk - 1]
      : Array.from({ length: 5 - startUses }, (_, i) => startUses + i);

  if (args.effects !== Effect.none.name || args.modifiers !== Modifier.none.name) {
    const desiredEffects = args.effects !== Effect.none.name ? parseEffects(args.effects) : [];
    const weightedModifiers = args.modifiers !== Modifier.none.name ? parseWeightedModifiers(args.modifiers) : {};

    const valuerFn = normalizeEffectValuer(hybridEffectValuer(desiredEffects, weightedModifiers));

    const bestPowers = buskRange.map((buskUses) =>
      findOptimalOutfitPower(valuerFn, buskUses, uselesseffects, true)
    );

    const result = makeBuskResultFromPowers(
      bestPowers,
      weightedModifiers,
      uselesseffects,
      startUses
    );

    print(
      `Hybrid strategy: prioritizing effects [${desiredEffects
        .map((e) => e.name)
        .join(", ")}], fallback modifiers [${Object.entries(weightedModifiers)
        .map(([m, w]) => `${w}×${m}`)
        .join(", ")}]`
    );

    printBuskResult(
      result,
      Object.keys(weightedModifiers).map((mod) => toModifier(mod)),
      desiredEffects
    );
  }
}
