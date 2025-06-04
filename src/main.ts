import { Args } from "grimoire-kolmafia";
import { findTopBusksFast, generateOne, printBuskResult } from "./buskingtest2";
import { NumericModifier, numericModifiers } from "libram";

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

function toModifierArray(input: string): NumericModifier[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is NumericModifier => s in numericModifiers);
}

const modifier = toModifierArray(args.modifiers);

const result = findTopBusksFast(generateOne, modifier);

export function main(): void {
  printBuskResult(result);
}
