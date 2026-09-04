// R12 物品与线索目录；获取状态由背包服务根据当前存档计算。
export const ITEM_CATALOG = Object.freeze({
  "item.key-a": {
    id: "item.key-a",
    name: "刻有“A”的老宅钥匙",
    category: "物品",
    layer: "items",
    source: "祠堂",
    image: new URL("../../images/items/key-a.svg", import.meta.url).href,
    description: "一把冰冷的旧钥匙，上面刻着字母“A”。"
  },
  "item.badge-b": {
    id: "item.badge-b",
    name: "烧毁大半的工作证",
    category: "物品",
    layer: "items",
    source: "祠堂",
    image: new URL("../../images/items/badge-b.svg", import.meta.url).href,
    description: "工作证的大半已经烧毁，只能辨认出姓氏“B”。"
  },
  "item.warning-tape": {
    id: "item.warning-tape",
    name: "警告录音带",
    category: "物品",
    layer: "items",
    source: "祠堂",
    image: new URL("../../images/items/warning-tape.svg", import.meta.url).href,
    description: "录音只留下警告：“不要急着认领任何名字。”"
  },
  "item.map-fragment-1": {
    id: "item.map-fragment-1",
    name: "手绘地图碎片一",
    category: "地图碎片",
    layer: "clues",
    source: "村口对话",
    image: new URL("../../images/items/map-fragment-1.svg", import.meta.url).href,
    description: "村庄手绘图的一部分。"
  },
  "item.map-fragment-2": {
    id: "item.map-fragment-2",
    name: "手绘地图碎片二",
    category: "地图碎片",
    layer: "clues",
    source: "拒签户对话",
    image: new URL("../../images/items/map-fragment-2.svg", import.meta.url).href,
    description: "村庄手绘图的一部分。"
  },
  "item.map-fragment-3": {
    id: "item.map-fragment-3",
    name: "手绘地图碎片三",
    category: "地图碎片",
    layer: "clues",
    source: "老人对话",
    image: new URL("../../images/items/map-fragment-3.svg", import.meta.url).href,
    description: "村庄手绘图的一部分。"
  },
  "item.village-map": {
    id: "item.village-map",
    name: "完整村庄手绘图",
    category: "地图",
    layer: "clues",
    source: "地图复原",
    image: new URL("../../images/items/restored-village-map.svg", import.meta.url).href,
    description: "复原后的手绘图上，几条旧路蜿蜒通向村庄深处。"
  },
  "clue.family-photo": {
    id: "clue.family-photo",
    name: "家庭照片",
    category: "老宅物品",
    layer: "items",
    source: "陈家老宅",
    image: new URL("../../images/items/old-photograph.svg", import.meta.url).href,
    description: "黑白合照里约十七岁的少年面容完整，脸上没有你那样的旧疤。"
  },
  "clue.sister-uniform": {
    id: "clue.sister-uniform",
    name: "妹妹的校服",
    category: "老宅物品",
    layer: "items",
    source: "陈家老宅",
    image: new URL("../../images/items/school-uniform.svg", import.meta.url).href,
    description: "石涧村小学的旧校服，尺寸属于年幼的孩子。"
  },
  "clue.height-marks": {
    id: "clue.height-marks",
    name: "身高刻痕",
    category: "老宅线索",
    layer: "clues",
    source: "陈家老宅",
    image: new URL("../../images/items/height-marks.svg", import.meta.url).href,
    description: "A与妹妹的两列身高记录；A的最后一笔标着十七岁，日期停在十七年前。"
  },
  "clue.funeral-list": {
    id: "clue.funeral-list",
    name: "送葬名单",
    category: "老宅物品",
    layer: "items",
    source: "陈家老宅",
    image: new URL("../../images/items/funeral-list.svg", import.meta.url).href,
    description: "十七年前的送葬记录把A和妹妹都列作死者，但它只能说明村里当时相信什么。"
  }
});

export const MAP_FRAGMENT_IDS = Object.freeze([
  "item.map-fragment-1",
  "item.map-fragment-2",
  "item.map-fragment-3"
]);
