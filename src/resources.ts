import { Item, mySign, Skill } from "kolmafia";
import { $familiar, $item, $skill, have } from "libram";

/* =========================
 * Helpers
 * ========================= */

const itemBonus = (item: Item, value: number) => (have(item) ? value : 0);
const skillBonus = (skill: Skill, value: number) => (have(skill) ? value : 0);

/* =========================
 * Familiar choice
 * ========================= */

const bestFam =
  have($familiar`Robortender`) ? $familiar`Robortender` :
  have($familiar`Jill-of-All-Trades`) ? $familiar`Jill-of-All-Trades` :
  have($familiar`Hobo Monkey`) ? $familiar`Hobo Monkey` :
  $familiar`Leprechaun`;

const usingCornbeefadon =
  have($familiar`Cornbeefadon`) && bestFam !== $familiar`Jill-of-All-Trades`;

export const familiarMultiplier = (() => {
  switch (bestFam) {
    case $familiar`Robortender`: return 2;
    case $familiar`Jill-of-All-Trades`: return 1.5;
    case $familiar`Hobo Monkey`: return 1.25;
    default: return 1;
  }
})();

export const familiarBonus = (() => {
  switch (bestFam) {
    case $familiar`Jill-of-All-Trades`: return 150;
    case $familiar`Hobo Monkey`: return 75;
    default: return 0;
  }
})();

/* =========================
 * Common flags
 * ========================= */

const hasJParka = have($item`Jurassic Parka`);

/* =========================
 * Familiar weight
 * ========================= */

const hat =
  itemBonus($item`crumpled felt fedora`, 10) ||
  itemBonus($item`Daylight Shavings Helmet`, 5) ||
  itemBonus($item`plexiglass pith helmet`, 5);

const shirt = hasJParka ? 0 : itemBonus($item`Stephen's lab coat`, 5);

const pants =
  itemBonus($item`repaid diaper`, 15) ||
  itemBonus($item`Great Wolf's beastly trousers`, 10);

export const familiarWeight = [
  hat,
  shirt,
  pants,
  usingCornbeefadon ? 10 : 0,
  skillBonus($skill`Amphibian Sympathy`, 5),
  skillBonus($skill`Empathy of the Newt`, 5),
  skillBonus($skill`Leash of Linguini`, 5),
  // eslint-disable-next-line libram/verify-constants
  skillBonus($skill`Only Dogs Love a Drunken Sailor`, 5),
].reduce((a, b) => a + b, 0);

/* =========================
 * Meat bonus (%)
 * ========================= */

export const meatBonus = [
  // equipment
  itemBonus($item`Cloak of Dire Shadows`, 10),
  itemBonus($item`garbage sticker`, 30),
  itemBonus($item`Half a Purse`, 60),
  itemBonus($item`mafia pointer finger ring`, 200),
  itemBonus($item`cosmic bowling ball`, 50),
  hasJParka ? 50 : 0,
  usingCornbeefadon ? 50 : 0,

  // skills
  skillBonus($skill`The Polka of Plenty`, 50),
  skillBonus($skill`Nimble Fingers`, 20),
  mySign() === "Wombat" ? 20 : 0,
  skillBonus($skill`5-D Earning Potential`, 20),
  skillBonus($skill`Budget Conscious`, 10),
  skillBonus($skill`Expert Panhandling`, 10),
  skillBonus($skill`Disco Leer`, 10),
  skillBonus($skill`Thief Among the Honorable`, 10),
  skillBonus($skill`Gnefarious Pickpocketing`, 10),

  // misc
  300, // How to Avoid Scams
].reduce((a, b) => a + b, 0);

/* =========================
 * Flat bonuses
 * ========================= */

export const flatBonus = [
  itemBonus($item`lucky gold ring`, 337),
  398, // Park Garbage
  itemBonus($item`model train set`, 277),
].reduce((a, b) => a + b, 0);

/* =========================
 * SongBoom
 * ========================= */

export const songboom = have($item`SongBoom™ BoomBox`) ? 1.25 : 1;

