// 背包目录：初始物品、剧情发放物品及老宅记录；获取状态来自宿主。
const rows = [
 ["burned-work-id","烧毁的工作证","items","随身物品","烧毁大半的工作证，还能辨认项目公司标识和姓氏B。"],
 ["blue-glass-bead","蓝玻璃珠","items","随身物品","一颗蓝玻璃珠，来历尚待调查。"],
 ["key-a","无标记旧钥匙","items","小X交付","没有字母或名字标记的旧钥匙。"],
 ["map-fragment-1","手绘地图碎片一","clues","小卖部老板","村庄手绘图的一部分。"],
 ["map-fragment-2","手绘地图碎片二","clues","拒签户","村庄手绘图的一部分。"],
 ["map-fragment-3","手绘地图碎片三","clues","年老村民","村庄手绘图的一部分。"],
 ["restored-village-map","完整村庄地图","clues","地图复原","三块手绘图复原后的路线记录。"],
 ["old-photograph","家庭照片","items","陈家老宅·照片调查记录","照片里的A、妹妹和父亲；A当时面容完整。"],
 ["school-uniform","妹妹的校服","items","陈家老宅·校服调查记录","妹妹的旧物，与蓝玻璃珠存在实体联系。"],
 ["height-marks","身高刻痕","clues","陈家老宅·刻痕调查记录","事故时A约十七岁，妹妹才是村小学生。"],
 ["funeral-list","送葬名单","items","陈家老宅·名单调查记录","妹妹死亡，A也被村里作为死者送葬。"]
];
export const ITEMS=Object.freeze(rows.map(([id,name,layer,source,description])=>({
 id,name,layer,source,description,image:new URL("../../../images/exploration/items/"+id+".svg",import.meta.url).href
})));
