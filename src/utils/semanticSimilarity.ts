/**
 * Calcular similitud coseno entre dos vectores.
 * @param vecA Primer vector.
 * @param vecB Segundo vector.
 * @returns Similitud coseno entre los dos vectores.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (dot === 0) return 0;
  // Una sola raíz cuadrada en lugar de dos: sqrt(a) * sqrt(b) == sqrt(a * b)
  const denom = Math.sqrt(normA * normB);
  return denom === 0 ? 0 : dot / denom;
}

interface VectorItem {
  vector?: number[];
  embedding?: number[];
  [key: string]: any;
}

interface ScoredItem<T> {
  item: T;
  similarity: number;
  vector: number[];
  id?: string | number;
}

/**
 * Encuentra N elementos más similares usando Máxima Relevancia Marginal (MMR).
 * @template T El tipo del objeto elemento.
 */
export function findMostSimilar<T extends VectorItem>(
  targetEmbedding: number[],
  items: T[],
  topN: number = 5,
  diversityFactor: number = 0.5,
  threshold: number = 0.5
): Array<{ item: T; similarity: number }> {

  if (!targetEmbedding || !items?.length) return [];

  // Pre-computar normas de vectores para eficiencia en similitud coseno y MMR
  const normCache = new Map<number[], number>();
  const getMagnitude = (v: number[]): number => {
    let n = normCache.get(v);
    if (n === undefined) {
      let sq = 0;
      for (let i = 0; i < v.length; i++) sq += v[i] * v[i];
      n = Math.sqrt(sq);
      normCache.set(v, n);
    }
    return n;
  };

  // Producto punto entre dos vectores
  const dotProduct = (a: number[], b: number[]): number => {
    let d = 0;
    for (let i = 0; i < a.length; i++) d += a[i] * b[i];
    return d;
  };

  const cachedCos = (a: number[], b: number[]): number => {
    const na = getMagnitude(a);
    const nb = getMagnitude(b);
    if (na === 0 || nb === 0) return 0;
    const d = dotProduct(a, b);
    if (d === 0) return 0;
    return d / (na * nb);
  };

  // 1. Calcular similitudes iniciales (normas en caché aquí, reutilizadas en MMR)
  const candidates: ScoredItem<T>[] = [];

  for (const item of items) {
    const vec = item.vector || item.embedding;
    if (!vec || vec.length !== targetEmbedding.length) continue;

    const similarity = cachedCos(targetEmbedding, vec);
    if (similarity >= threshold) {
      candidates.push({ item, similarity, vector: vec });
    }
  }

  // 2. Ordenar por relevancia descendente
  candidates.sort((a, b) => b.similarity - a.similarity);

  // 3. Modo de Relevancia Pura
  if (diversityFactor >= 1.0) {
    return candidates
      .slice(0, topN)
      .map(({ item, similarity }) => ({ item, similarity }));
  }

  // 4. Preparación MMR
  // Limitar el tamaño del conjunto para evitar O(N^2) en conjuntos de datos masivos
  const poolLimit = Math.min(candidates.length, topN * 4);
  const pool = candidates.slice(0, poolLimit);
  const selected: ScoredItem<T>[] = [];

  // 5. Bucle MMR
  while (selected.length < topN && pool.length > 0) {
    let bestScore = -Infinity;
    let bestIdx = -1;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];

      // Calcular Redundancia: Máxima similitud con cualquier elemento ya seleccionado
      let maxSimToSelected = 0;
      for (const selectedItem of selected) {
        const sim = cachedCos(candidate.vector, selectedItem.vector);
        if (sim > maxSimToSelected) maxSimToSelected = sim;
      }

      // Ecuación MMR: Lambda * Relevancia - (1 - Lambda) * Redundancia
      const mmrScore =
        diversityFactor * candidate.similarity -
        (1 - diversityFactor) * maxSimToSelected;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      selected.push(pool[bestIdx]);
      // Eliminación eficiente de array (Swap-Pop)
      pool[bestIdx] = pool[pool.length - 1];
      pool.pop();
    } else {
      break;
    }
  }

  // MMR elige por diversidad; se muestran ordenadas por similitud
  return selected
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ item, similarity }) => ({ item, similarity }));
}
