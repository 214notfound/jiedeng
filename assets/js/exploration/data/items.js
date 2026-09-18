// 背包目录：宿主状态决定“是否获得”，displayGroup 只决定背包中的展示分组。
// 不以展示分组替代 inventory / clues，避免影响剧情条件、存档和小游戏契约。
const DISPLAY_GROUPS = Object.freeze({
 "burned-work-id":"objects",
 "blue-glass-bead":"objects",
 "key-a":"objects",
 "old-photograph":"objects",
 "school-uniform":"objects",
 "funeral-list":"objects",
 "map-fragment-1":"leads",
 "map-fragment-2":"leads",
 "map-fragment-3":"leads",
 "restored-village-map":"leads",
 "height-marks":"leads"
});
const rows = [
 ["burned-work-id","烧毁的工作证","随身物品","烧毁大半的工作证，公司信息已经模糊，只能辨认姓名栏中的姓氏“王”。",null,"burned-work-id.png"],
 ["blue-glass-bead","蓝玻璃珠","随身物品","一颗蓝玻璃珠，来历尚待调查。","blue-glass-bead.png"],
 ["su-he-notice","苏禾寻人启事","村口墙面","寻人启事上写着：苏禾，村小学教师，近日失踪。","su-he-notice.png","su-he-notice.png"],
 ["key-a","无标记旧钥匙","小周交付","没有字母或名字标记的旧钥匙。"],
 ["map-fragment-1","手绘地图碎片一","小卖部老板","村庄手绘图的一部分。",null,"map-fragment-1.png"],
 ["map-fragment-2","手绘地图碎片二","拒签户","村庄手绘图的一部分。",null,"map-fragment-2.png"],
 ["map-fragment-3","手绘地图碎片三","年老村民","村庄手绘图的一部分。",null,"map-fragment-3.png"],
 ["restored-village-map","完整村庄地图","地图复原","三块手绘图复原后的路线记录。",null,"restored-village-map.png"],
 ["old-photograph","家庭照片","陈家老宅·照片调查记录","照片里有父亲、陈晋年和妹妹；陈晋年当时面容完整。","old-photograph.png"],
 ["school-uniform","妹妹的校服","陈家老宅·校服调查记录","妹妹的旧物，与蓝玻璃珠存在实体联系。","school-uniform.png"],
 ["height-marks","身高刻痕","陈家老宅·刻痕调查记录","事故时陈晋年约十七岁，妹妹才是村小学生。",null,"height-marks.png"],
 ["funeral-list","送葬名单","陈家老宅·名单调查记录","妹妹死亡，陈晋年也被村里作为死者送葬。",null,"funeral-list.png"]
];
const AUTO_OPEN_ON_ACQUIRE_IDS = new Set([
 "map-fragment-1",
 "map-fragment-2",
 "map-fragment-3"
]);
export const ITEMS=Object.freeze(rows.map(([
 id,name,source,description,detailImageName=null,imageName=id+".svg"
])=>({
 id,
 name,
 source,
 description,
 displayGroup:DISPLAY_GROUPS[id]??"objects",
 image:new URL("../../../images/exploration/items/"+imageName,import.meta.url).href,
 ...(AUTO_OPEN_ON_ACQUIRE_IDS.has(id) ? {autoOpenOnAcquire:true} : {}),
 ...(detailImageName ? {
  detailImage:new URL("../../../images/exploration/items/"+detailImageName,import.meta.url).href
 } : {})
})));
