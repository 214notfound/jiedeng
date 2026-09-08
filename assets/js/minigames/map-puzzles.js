// Stable public entry for the V1 map puzzle module.
// Runtime orchestration is injected through createMapPuzzleAdapter({ onEvent }).
export { createMapPuzzleAdapter } from "./map-puzzle/adapter/map-puzzle-adapter.js";
export {
  createPuzzleLevel,
  createPuzzleSession,
  isPuzzleCompleted,
  restorePuzzleProgress,
  serializePuzzleProgress,
  shufflePieceIds,
  tryPlacePiece
} from "./map-puzzle/core/puzzle-core.js";
