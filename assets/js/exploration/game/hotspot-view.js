// 将“剧情动作”整理成玩家实际看到的热点：一个物体只占一个位置。
export function buildHotspotViews(scene, presentation) {
  const interactionById = new Map(
    scene.interactions.map((interaction) => [interaction.id, interaction])
  );
  const hotspotViews = [];

  for (const hotspot of presentation.hotspots) {
    const actions = hotspot.interactionIds
      .map((interactionId) => interactionById.get(interactionId))
      .filter(Boolean);

    const nextAction = actions.find((action) => action.available && !action.completed);
    const lastCompletedAction = [...actions].reverse().find((action) => action.completed);
    const firstPendingAction = actions.find((action) => !action.completed);
    const interaction = nextAction ?? lastCompletedAction ?? firstPendingAction;

    if (!interaction) continue;

    const shouldWaitUntilAvailable = hotspot.reveal === "available"
      && !nextAction
      && !lastCompletedAction;
    if (shouldWaitUntilAvailable) continue;

    hotspotViews.push({ ...hotspot, interaction });
  }

  return hotspotViews;
}
