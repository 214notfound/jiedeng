const DIRECTIONS = ["N", "E", "S", "W"];
const DELTAS = Object.freeze({
  N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1]
});
const OPPOSITE = Object.freeze({N: "S", E: "W", S: "N", W: "E"});
const BASE_CONNECTORS = Object.freeze({
  blank: [],
  straight: ["N", "S"],
  corner: ["N", "E"],
  tee: ["N", "E", "W"],
  terminal: ["N"],
  server: ["E", "S", "W"]
});

export function connectorsFor(tile) {
  if (!tile || !(tile.type in BASE_CONNECTORS)) return [];
  const turns = (((tile.rotation ?? 0) / 90) % 4 + 4) % 4;
  return BASE_CONNECTORS[tile.type].map((direction) => {
    const index = (DIRECTIONS.indexOf(direction) + turns) % 4;
    return DIRECTIONS[index];
  });
}

export function rotateTile(board, index) {
  const tile = board[index];
  if (!tile || tile.type === "blank") return board;
  return board.map((entry, current) => current === index
    ? {...entry, rotation: ((entry.rotation ?? 0) + 90) % 360}
    : {...entry});
}

export function analyzeNetwork(board, rows = 5, cols = 5) {
  if (!Array.isArray(board) || board.length !== rows * cols) {
    throw new TypeError("network board size does not match its grid");
  }
  const serverIndex = board.findIndex((tile) => tile.type === "server");
  if (serverIndex < 0) throw new Error("network board requires one server");
  const connected = new Set([serverIndex]);
  const queue = [serverIndex];
  const openEnds = [];

  board.forEach((tile, index) => {
    if (tile.type === "blank") return;
    const row = Math.floor(index / cols);
    const col = index % cols;
    for (const direction of connectorsFor(tile)) {
      const [dr, dc] = DELTAS[direction];
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
        openEnds.push({index, direction, reason: "edge"});
        continue;
      }
      const nextIndex = nextRow * cols + nextCol;
      const neighbor = board[nextIndex];
      if (neighbor.type === "blank") {
        openEnds.push({index, direction, nextIndex, reason: "blank"});
      } else if (!connectorsFor(neighbor).includes(OPPOSITE[direction])) {
        openEnds.push({index, direction, nextIndex, reason: "mismatch"});
      }
    }
  });

  while (queue.length) {
    const index = queue.shift();
    const row = Math.floor(index / cols);
    const col = index % cols;
    for (const direction of connectorsFor(board[index])) {
      const [dr, dc] = DELTAS[direction];
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) continue;
      const nextIndex = nextRow * cols + nextCol;
      if (!connectorsFor(board[nextIndex]).includes(OPPOSITE[direction])) continue;
      if (!connected.has(nextIndex)) {
        connected.add(nextIndex);
        queue.push(nextIndex);
      }
    }
  }

  const terminals = Object.fromEntries(board
    .map((tile, index) => ({tile, index}))
    .filter(({tile}) => tile.type === "terminal")
    .map(({tile, index}) => [tile.terminalId, connected.has(index)]));
  const activeTileCount = board.filter((tile) => tile.type !== "blank").length;
  const connectedTileCount = [...connected].filter((index) => board[index].type !== "blank").length;
  return {
    connected,
    terminals,
    activeTileCount,
    connectedTileCount,
    openEnds,
    completed: connectedTileCount === activeTileCount && openEnds.length === 0
  };
}
