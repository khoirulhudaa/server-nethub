// server/utils/topologyMatcher.js
export function matchTopology(submitted, correct, threshold = 0.85) {
  if (!correct?.nodes?.length) return { score: 0, isCorrect: false };

  // 1. Cocokkan jumlah node (label + type)
  const correctNodeMap = new Map(
    correct.nodes.map((n) => [`${n.data?.type}-${n.data?.label}`, n])
  );
  let matchedNodes = 0;
  submitted.nodes?.forEach((n) => {
    const key = `${n.data?.type}-${n.data?.label}`;
    if (correctNodeMap.has(key)) matchedNodes++;
  });
  const nodeScore = matchedNodes / correct.nodes.length;

  // 2. Cocokkan edge (source-target + cableType)
  const correctEdgeSet = new Set(
    correct.edges.map(
      (e) =>
        `${e.source}->${e.target}:${e.data?.cableType || "utp"}`
    )
  );
  let matchedEdges = 0;
  submitted.edges?.forEach((e) => {
    const key = `${e.source}->${e.target}:${e.data?.cableType || "utp"}`;
    if (correctEdgeSet.has(key)) matchedEdges++;
  });
  const edgeScore =
    correct.edges.length === 0 ? 1 : matchedEdges / correct.edges.length;

  const finalScore = (nodeScore * 0.4 + edgeScore * 0.6); // bobot edge lebih penting
  return {
    score: Math.round(finalScore * 100) / 100,
    isCorrect: finalScore >= threshold,
  };
}