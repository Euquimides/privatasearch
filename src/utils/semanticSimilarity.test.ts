import { describe, it, expect } from "vitest";
import { cosineSimilarity, findMostSimilar } from "./semanticSimilarity";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 2], [-1, -2])).toBeCloseTo(-1);
  });

  it("returns 0 for vectors of different length", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });

  it("returns 0 when either vector is all zeros", () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });
});

describe("findMostSimilar", () => {
  const items = [
    { id: "a", vector: [1, 0] },      // idéntico al target
    { id: "b", vector: [0.9, 0.1] },  // muy similar
    { id: "c", vector: [0, 1] },      // ortogonal, por debajo del umbral
    { id: "d", vector: [-1, 0] },     // opuesto
  ];

  it("returns [] when target embedding is missing", () => {
    expect(findMostSimilar(undefined as unknown as number[], items)).toEqual([]);
  });

  it("returns [] when items list is empty", () => {
    expect(findMostSimilar([1, 0], [])).toEqual([]);
  });

  it("filters out items below the similarity threshold", () => {
    const result = findMostSimilar([1, 0], items, 5, 1.0, 0.5);
    expect(result.map((r) => r.item.id)).not.toContain("c");
    expect(result.map((r) => r.item.id)).not.toContain("d");
  });

  it("orders by pure relevance when diversityFactor is 1", () => {
    // "d" queda fuera: similitud -1 (opuesto) no alcanza el umbral 0
    const result = findMostSimilar([1, 0], items, 5, 1.0, 0);
    expect(result.map((r) => r.item.id)).toEqual(["a", "b", "c"]);
  });

  it("respects topN", () => {
    const result = findMostSimilar([1, 0], items, 1, 1.0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].item.id).toBe("a");
  });

  it("skips items without a usable vector", () => {
    const withMissing = [...items, { id: "e" }, { id: "f", vector: [1] }];
    const result = findMostSimilar([1, 0], withMissing, 10, 1.0, 0);
    expect(result.map((r) => r.item.id)).not.toContain("e");
    expect(result.map((r) => r.item.id)).not.toContain("f");
  });

  it("reads from .embedding when .vector is absent", () => {
    const result = findMostSimilar([1, 0], [{ id: "g", embedding: [1, 0] }], 5, 1.0, 0.5);
    expect(result).toHaveLength(1);
    expect(result[0].similarity).toBeCloseTo(1);
  });
});
