import { Task } from "./task";
import { Engine as BaseEngine, Outfit, outfitSlots } from "grimoire-kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $skill,
  get,
  have,
  PropertiesManager,
  undelay,
  uneffect,
} from "libram";
import { Item, myHp, myMaxhp, print, useSkill } from "kolmafia";

export class Engine extends BaseEngine {
  public getNextTask(): Task | undefined {
    return this.tasks.find((task) => !task.completed() && (task.ready ? task.ready() : true));
  }

  public execute(task: Task): void {
    if (have($effect`Beaten Up`)) {
      if (
        get("_lastCombatLost") &&
        !get("lastEncounter").includes("Sssshhsssblllrrggghsssssggggrrgglsssshhssslblgl")
      )
        throw "Fight was lost; stop.";
      else uneffect($effect`Beaten Up`);
    }
    if (task.completed()) {
      print(`${task.name} completed!`, "blue");
    } else {
      print(`${task.name} not completed!`, "blue");
    }
  }

  createOutfit(task: Task): Outfit {
    // Handle unequippables in outfit here
    const spec = undelay(task.outfit);
    if (spec === undefined) {
      return new Outfit();
    }

    if (spec.familiar && !have(spec.familiar)) {
      print(`Ignoring using a familiar because we don't have ${spec.familiar}`, "red");
      spec.familiar = $familiar.none;
    }

    if (spec instanceof Outfit) {
      const badSlots = Array.from(spec.equips.entries())
        .filter(([, it]) => !have(it) && it !== $item.none)
        .map(([s]) => s);
      badSlots.forEach((s) => {
        print(`Ignoring slot ${s} because we don't have ${spec.equips.get(s) ?? ""}`, "red");
        spec.equips.delete(s);
      });
      return spec.clone();
    }

    // spec is an OutfitSpec
    for (const slotName of outfitSlots) {
      const itemOrItems = spec[slotName];
      if (itemOrItems) {
        if (itemOrItems instanceof Item) {
          if (!have(itemOrItems) && itemOrItems !== null) {
            print(`Ignoring slot ${slotName} because we don't have ${itemOrItems}`, "red");
            spec[slotName] = undefined;
          }
        } else {
          if (!itemOrItems.some((it) => have(it) && it !== null)) {
            print(
              `Ignoring slot ${slotName} because we don't have ${itemOrItems
                .map((it) => it.name)
                .join(", ")}`,
              "red"
            );
            spec[slotName] = undefined;
          }
        }
      }
    }
    return Outfit.from(spec, new Error("Failed to equip outfit"));
  }

  dress(task: Task, outfit: Outfit): void {
    super.dress(task, outfit);
  }

  prepare(task: Task): void {
    super.prepare(task);
    if (task.combat !== undefined && myHp() < myMaxhp() * 0.9) useSkill($skill`Cannelloni Cocoon`);
  }

  initPropertiesManager(manager: PropertiesManager): void {
    super.initPropertiesManager(manager);
    const bannedAutoRestorers = [
      "sleep on your clan sofa",
      "rest in your campaway tent",
      "rest at the chateau",
      "rest at your campground",
      "free rest",
    ]; /*add a comment for lulz*/
    const bannedAutoHpRestorers = [...bannedAutoRestorers];
    const bannedAutoMpRestorers = [...bannedAutoRestorers];
    const hpItems = get("hpAutoRecoveryItems")
      .split(";")
      .filter((s) => !bannedAutoHpRestorers.includes(s))
      .join(";");
    const mpItems = Array.from(
      new Set([...get("mpAutoRecoveryItems").split(";"), "doc galaktik's invigorating tonic"])
    )
      .filter((s) => !bannedAutoMpRestorers.includes(s))
      .join(";");
    manager.set({
      autoSatisfyWithCloset: false,
      hpAutoRecovery: -0.05,
      mpAutoRecovery: -0.05,
      maximizerCombinationLimit: 0,
      hpAutoRecoveryItems: hpItems,
      mpAutoRecoveryItems: mpItems,
      shadowLabyrinthGoal: "effects",
    });
  }
}
