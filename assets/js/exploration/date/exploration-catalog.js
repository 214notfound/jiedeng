// V1 探索数据统一出口；新增阶段时在 data 目录建立文件，再在此登记。
import { ITEM_CATALOG, MAP_FRAGMENT_IDS } from "./items.js";
import { PROLOGUE_SCENE } from "./exploration-prologue.js";
import { VILLAGE_SCENE } from "./village.js";
import {
  OLD_HOUSE_CLUE_INTERACTION_IDS,
  OLD_HOUSE_SCENE
} from "./old-house.js";

export { ITEM_CATALOG, MAP_FRAGMENT_IDS, OLD_HOUSE_CLUE_INTERACTION_IDS };

export const SCENE_CATALOG = Object.freeze({
  [PROLOGUE_SCENE.id]: PROLOGUE_SCENE,
  [VILLAGE_SCENE.id]: VILLAGE_SCENE,
  [OLD_HOUSE_SCENE.id]: OLD_HOUSE_SCENE
});
