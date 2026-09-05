# PR-3 复审问题处理记录

| 编号 | 处理结果 | 验证 |
| --- | --- | --- |
| N-1 引擎哈希在 Git 检出后失效 | 在快照目录加入 `.gitattributes`，对 JavaScript 关闭换行转换；来源清单按实际字节校验 | 原目录与模拟 Git 提交、重新克隆后均通过 8/8 SHA-256 |
| N-2 背包分类与合同相反 | 目录移除固定 `layer`；运行时只按 `state.inventory/state.clues` 分类 | 地图碎片/完整地图为物品，老宅四项为线索 |
| N-3 物体调查服务拥有全部 NPC 对话 | 在 exploration 内建立独立 `conversation` 数据与服务，`integration` 仅负责页面组合 | 物体调查服务不返回对白；对话事件 `source=conversation` |
| N-4 单条异常成就导致整页失败 | 结构错误仍拒绝；单条事实/时间不一致改为 `available:false` | 成就服务和页面可继续展示降级卡片 |

正式 Host、账户/存档、真实地图和公共游戏壳仍是团队联调项，不在本包中虚构实现。
