// 跨页面演示宿主：只保存本标签页的演示进度，供页面联调使用。
import { createDemoHost } from "./demo-host.js";
export const DEMO_SESSION_KEY = "jiedeng:demo:exploration-achievements:v1";

export function createDemoSession(storage) {
  const raw = storage.getItem(DEMO_SESSION_KEY);
  let initialState;
  if (raw !== null) {
    const record = JSON.parse(raw);
    if (record?.version !== 1 || record?.kind !== "exploration-demo" || !record.state) {
      throw new Error("演示记录格式无效，原记录未修改。");
    }
    initialState = record.state;
  }
  const host = createDemoHost("guest", initialState);
  const stopSaving = host.subscribe(() => {
    storage.setItem(DEMO_SESSION_KEY, JSON.stringify({
      version: 1, kind: "exploration-demo", state: host.getContext().state
    }));
  });
  return {
    getContext: host.getContext,
    dispatch: host.dispatch,
    subscribe: host.subscribe,
    dispose: stopSaving
  };
}
