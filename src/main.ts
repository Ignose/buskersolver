import { Args } from "grimoire-kolmafia";
import { findTopBusksFast, generateOne, printBuskResult } from "./utils";
import { Effect, Modifier, print, toEffect, toModifier } from "kolmafia";
import { $effects } from "libram";

export const args = Args.create("Beret Busk Tester", "Be good, be kind", {
  help: Args.boolean({
    help: "What do you mean, I am help?",
    default: false,
  }),
  modifiers: Args.string({
    help: `Numeric Modifiers to check; these can be singular like modifiers="Meat Drop", multiple like modifiers="Meat Drop, Familiar Weight" or weighted like modifiers="5 Meat Drop, 10 Familiar Weight"`,
    default: "Meat Drop",
  }),
  uselesseffects: Args.string({
    help: `Effects that aren't helpful for you, for instance uselesseffects="Leash of Linguini, Empathy, Thoughtful Empathy"`,
    default: "",
  }),
});

function parseWeightedModifiers(input: string): [Modifier, number][] {
  return input
    .split(",")
    .map((s) => s.trim())
    .map((entry) => {
      const match = entry.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const [, weightStr, modStr] = match;
        const mod = toModifier(modStr.trim());
        const weight = parseFloat(weightStr);
        if (mod && !isNaN(weight)) return [mod, weight];
      } else {
        const mod = toModifier(entry);
        if (mod) return [mod, 1]; // default weight = 1
      }
      return null;
    })
    .filter((m): m is [Modifier, number] => m !== null);
}

function parseEffects(input: string): Effect[] {
  const effectList = input
    .split(",")
    .map((entry) => toEffect(entry.trim()))
    .filter((e): e is Effect => e !== null); // Remove invalid entries
  return effectList.length > 0 ? effectList : $effects``;
}

export function main(command?: string): void {
  Args.fill(args, command);

  if (args.help) {
    Args.showHelp(args);
    return;
  }

  const weightedModifiers = parseWeightedModifiers(args.modifiers);
  const uselesseffects = parseEffects(args.uselesseffects);

  const result = findTopBusksFast(generateOne, weightedModifiers, uselesseffects);

  print(
    `DEBUG: Parsed modifiers = ${weightedModifiers.map(([m, w]) => `${w}×${m.name}`).join(", ")}`
  );
  printBuskResult(
    result,
    weightedModifiers.map(([m]) => m)
  );
}
