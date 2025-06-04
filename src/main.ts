
import { Args } from "grimoire-kolmafia";
import { findTopBusksFast, generateOne, printBuskResult } from "./buskingtest2";
import { Modifier, print, toModifier } from "kolmafia";

const args = Args.create(
  "Beret Busk Tester",
  'Be good, be kind',
  {
    modifiers: Args.string({
      help: "Numeric Modifier to check",
      default: "Meat Drop"
    })
  }
)

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

export function main(command?: string): void {
  Args.fill(args, command);

  const weightedModifiers = parseWeightedModifiers(args.modifiers);

  const result = findTopBusksFast(generateOne, weightedModifiers);

  print(`DEBUG: Parsed modifiers = ${weightedModifiers.map(([m, w]) => `${w}×${m.name}`).join(", ")}`);
  printBuskResult(result, weightedModifiers.map(([m]) => m));
}
