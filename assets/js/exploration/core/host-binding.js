// 探索板块共用的只读宿主绑定：校验身份、订阅生命周期和状态读取。
export function bindHost({getContext, subscribe}, validate) {
  if (typeof getContext !== "function" || typeof subscribe !== "function") {
    throw new TypeError("缺少宿主读取或订阅接口。");
  }
  const scope = getContext()?.storageScope;
  if (typeof scope !== "string" || !/^(guest|account:[^\s]+)$/.test(scope)) {
    throw new Error("身份标识无效。");
  }
  let disposed = false;
  let invalid = false;
  const stops = new Set();
  function read() {
    if (disposed || invalid) throw new Error("当前页面已失效，请重新进入。");
    let context;
    try {
      context = getContext();
      if (context?.storageScope !== scope) throw new Error("身份已变化，请重新进入。");
    } catch (error) {
      invalid = true;
      throw error;
    }
    validate(context);
    return context;
  }
  function onChange(listener) {
    if (typeof listener !== "function") throw new TypeError("订阅者必须是函数。");
    read();
    let stopped = false;
    const cancel = subscribe(() => {
      if (stopped || disposed) return;
      try { read(); } catch (error) { console.error("[module-host] 读取失败。", error); }
      try { listener(); } catch (error) { console.error("[module-host] 界面更新失败。", error); }
    });
    if (typeof cancel !== "function") throw new TypeError("subscribe 必须返回清理函数。");
    const stop = () => {
      if (stopped) return;
      stopped = true;
      stops.delete(stop);
      try { cancel(); } catch (error) { console.error("[module-host] 清理失败。", error); }
    };
    stops.add(stop);
    return stop;
  }
  read();
  return {
    read,
    scope,
    subscribe: onChange,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const stop of [...stops]) stop();
    }
  };
}

export function requireIds(value, label) {
  if (!Array.isArray(value)
    || value.some((id) => typeof id !== "string" || !id)
    || new Set(value).size !== value.length) {
    throw new Error(label + "格式无效。");
  }
}
