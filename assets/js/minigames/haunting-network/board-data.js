const tile = (type, solvedRotation = 0, rotation = solvedRotation, extra = {}) => ({
  type,
  rotation,
  solvedRotation,
  ...extra
});

export const NETWORK_ROWS = 5;
export const NETWORK_COLS = 5;

export const INITIAL_BOARD = Object.freeze([
  tile("blank"), tile("blank"), tile("terminal", 180, 90, {terminalId: "lamp"}), tile("blank"), tile("blank"),
  tile("corner", 90, 0), tile("straight", 90, 0), tile("tee", 0, 90), tile("tee", 180, 270), tile("corner", 180, 90),
  tile("terminal", 0, 90, {terminalId: "broadcast"}), tile("corner", 90, 180), tile("server", 0, 90), tile("tee", 270, 0), tile("straight", 0, 90),
  tile("blank"), tile("tee", 90, 180), tile("tee", 0, 270), tile("tee", 0, 90), tile("corner", 270, 180),
  tile("blank"), tile("terminal", 0, 270, {terminalId: "drain"}), tile("blank"), tile("blank"), tile("blank")
]);

export function createInitialBoard() {
  return INITIAL_BOARD.map((entry) => ({...entry}));
}

export function createSolvedBoard() {
  return INITIAL_BOARD.map((entry) => ({...entry, rotation: entry.solvedRotation}));
}
