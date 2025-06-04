
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

function toModifierArray(input: string): Modifier[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .map((s) => toModifier(s))
    .filter((m): m is Modifier => m !== undefined && m !== null);
}

export function main(command?: string): void {
  Args.fill(args, command);

  const modifier = toModifierArray(args.modifiers);

  const result = findTopBusksFast(generateOne, modifier);

  print(`DEBUG: Parsed modifiers = ${modifier.join(", ")}`);
  printBuskResult(result, modifier);
}
