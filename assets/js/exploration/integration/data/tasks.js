import {EXPLORATION_TASKS, explorationTaskFor} from "../../data/exploration.js";
import {CONVERSATION_TASKS, conversationTaskFor} from "../../conversation/data/conversations.js";

export const INTERACTION_TASKS = Object.freeze([
  ...EXPLORATION_TASKS,
  ...CONVERSATION_TASKS
]);

export function interactionTaskFor(command) {
  return explorationTaskFor(command) ?? conversationTaskFor(command);
}
