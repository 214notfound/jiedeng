export const MINE_WORLD = Object.freeze({width: 2200, height: 1300});
export const MINE_PLAYER_START = Object.freeze({x: 160, y: 620, w: 38, h: 46});
export const MINE_VALVE = Object.freeze({x: 720, y: 270, w: 58, h: 58});
export const MINE_DOOR = Object.freeze({x: 1580, y: 500, w: 44, h: 300});
export const MINE_EXIT = Object.freeze({x: 2040, y: 610, w: 86, h: 110});

const freezeEntries = (entries) => Object.freeze(entries.map((entry) => Object.freeze(entry)));

export const MINE_INSPECT_POINTS = freezeEntries([
  {
    id: "inspect-b17-sign", x: 260, y: 250, radius: 110, prompt: "[E] 查看路牌",
    text: "B-17，下游排水区。褪色的箭头仍然指向矿井深处。"
  },
  {
    id: "inspect-toolbox", x: 300, y: 1030, radius: 100, prompt: "[E] 查看",
    text: "工具箱没有上锁。里面只剩几把生锈的扳手，像是有人离开时根本来不及收拾。"
  },
  {
    id: "inspect-duty-record", x: 760, y: 460, radius: 100, prompt: "[E] 查看记录",
    text: "“B-17 夜间排水异常。下层线路由上层控制室接管。”"
  },
  {
    id: "inspect-shaft-sign", x: 1850, y: 340, radius: 105, prompt: "[E] 查看标记",
    text: "褪色的施工标记仍然指向“内部竖井”。"
  },
  {
    id: "inspect-water-gauge", x: 1880, y: 1030, radius: 105, prompt: "[E] 查看水位刻度",
    text: "刻度上还留着过去的最高水位。现在水位低了很多——这里的排水系统似乎一直没有真正停止。"
  }
]);

export const MINE_LAMPS = freezeEntries([
  {id: "mine-lamp-a", x: 980, y: 440, radius: 100, lightRadius: 220},
  {id: "mine-lamp-b", x: 1830, y: 820, radius: 100, lightRadius: 220}
]);

export const MINE_WALLS = freezeEntries([
  {x: 0, y: 0, w: 2200, h: 60},
  {x: 0, y: 1240, w: 2200, h: 60},
  {x: 0, y: 0, w: 60, h: 1300},
  {x: 2140, y: 0, w: 60, h: 1300},
  {x: 360, y: 160, w: 320, h: 110},
  {x: 410, y: 880, w: 430, h: 120},
  {x: 920, y: 180, w: 260, h: 130},
  {x: 1050, y: 850, w: 300, h: 120},
  {x: 1580, y: 60, w: 44, h: 440},
  {x: 1580, y: 800, w: 44, h: 440}
]);
