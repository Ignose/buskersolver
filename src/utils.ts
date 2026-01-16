import { familiarMultiplier, familiarWeight, flatBonus, meatBonus, songboom } from "./resources";

export const baseMeat = () => 250 * songboom;

export function familiarWeightToMeat(): number {
  return 2 * familiarMultiplier +
    Math.sqrt(220 * familiarMultiplier) / (2 * Math.sqrt(20 + familiarWeight))
}

export const totalMeat = () => baseMeat() * ( 1 + (familiarWeight + meatBonus)/ 100) + flatBonus;
