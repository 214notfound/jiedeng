// 探索交互组合适配器：合并调查与对话视图；不拥有剧情状态，也不切换剧情 Node。
import {createExploration} from "../../game/exploration.js";
import {createConversation} from "../../conversation/game/conversation.js";

export function createInteractionModule(host) {
  const exploration = createExploration(host);
  let conversation;
  try {
    conversation = createConversation(host);
  } catch (error) {
    exploration.dispose();
    throw error;
  }

  function sameScene() {
    const sceneId = exploration.getCurrentSceneId();
    if (conversation.getCurrentSceneId() !== sceneId) {
      throw new Error("探索与对话读取到不同剧情地点。");
    }
    return sceneId;
  }

  function getSceneView(sceneId) {
    if (sceneId !== sameScene()) throw new Error("地点已经变化。");
    const explored = exploration.getSceneView(sceneId);
    const talked = conversation.getSceneView(sceneId);
    return {name: explored.name, interactions: [...explored.interactions, ...talked.interactions]};
  }

  function getLayout() {
    const explored = exploration.getLayout();
    const talked = conversation.getLayout();
    return {hotspots: [...explored.hotspots, ...talked.hotspots]};
  }

  function getReadingInput(sceneId, actionId) {
    if (sceneId !== sameScene()) throw new Error("地点已经变化。");
    return conversation.getReadingInput(sceneId, actionId);
  }

  function completeReading(sceneId, actionId, result) {
    if (sceneId !== sameScene()) throw new Error("地点已经变化。");
    return conversation.completeReading(sceneId, actionId, result);
  }

  function getReadingChoiceInput(sceneId, actionIds) {
    if (sceneId !== sameScene()) throw new Error("地点已经变化。");
    return conversation.getReadingChoiceInput(sceneId, actionIds);
  }

  async function interact(sceneId, actionId, options) {
    const explorationIds = new Set(
      exploration.getSceneView(sceneId).interactions.map((item) => item.id)
    );
    return explorationIds.has(actionId)
      ? exploration.interact(sceneId, actionId, options)
      : conversation.interact(sceneId, actionId, options);
  }

  function getExitStatus() {
    // 仅报告当前调查是否还有待办项；离场与 Node 推进由剧情模块负责。
    const labels = [...new Set([
      ...exploration.pendingLabels(),
      ...conversation.pendingLabels()
    ])];
    return {
      canLeave: false,
      message: labels.length
        ? "还需完成：" + labels.join("、") + "。"
        : "本轮调查已完成，请按剧情区的当前操作继续。"
    };
  }

  function subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("订阅者必须是函数。");
    if (typeof host.subscribe !== "function") throw new TypeError("缺少宿主订阅接口。");
    sameScene();
    let stopped = false;
    const cancel = host.subscribe(() => {
      if (stopped) return;
      try {
        sameScene();
        listener();
      } catch (error) {
        console.error("[interaction-module] 界面更新失败。", error);
      }
    });
    if (typeof cancel !== "function") throw new TypeError("subscribe 必须返回清理函数。");
    return () => {
      if (stopped) return;
      stopped = true;
      cancel();
    };
  }

  return Object.freeze({
    getCurrentSceneId: sameScene,
    getSceneView,
    getLayout,
    getReadingChoiceInput,
    getReadingInput,
    completeReading,
    listItems: exploration.listItems,
    getItemDetail: exploration.getItemDetail,
    interact,
    cancel: conversation.cancel,
    reportProgress: conversation.reportProgress,
    getExitStatus,
    getMapCommand: exploration.getMapCommand,
    canStartMapPuzzle: exploration.canStartMapPuzzle,
    subscribe,
    dispose() {
      exploration.dispose();
      conversation.dispose();
    }
  });
}
