import { myFamiliar } from "kolmafia";
import { $familiar, $item, get, have } from "libram";
import { OutfitSpec } from "grimoire-kolmafia";

export function baseOutfit(setupFight: boolean): OutfitSpec {
  return {
    weapon: have($item`June cleaver`) ? $item`June cleaver` : undefined,
    hat: $item`Daylight Shavings Helmet`,
    offhand: setupFight ? $item`latte lovers member's mug` : $item`can of mixed everything`,
    acc1: $item`lucky gold ring`,
    acc2: $item`mafia thumb ring`,
    acc3: $item`spring shoes`,
    pants: get("sweat") < 100 ? $item`designer sweatpants` : $item`pantogram pants`,
    familiar: get("gooseDronesRemaining") >= 6 ? $familiar`CookBookBat` : $familiar`Grey Goose`,
    famequip: myFamiliar() === $familiar`Grey Goose` ? $item`tiny stillsuit` : $item`tiny rake`,
    modifier: `familiar exp`,
  };
}
