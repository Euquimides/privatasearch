/**
 * Calcular similutud coseno entre dos vectores.
 * @param vecA Primer vector.
 * @param vecB Segundo vector.
 * @returns Similitud coseno entre los dos vectores.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  // Si el denominador es cero, retornar similitud 0
  if (dot === 0) return 0;

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
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

  // 1. Calcular similitudes iniciales
  const candidates: ScoredItem<T>[] = [];

  for (const item of items) {
    const vec = item.vector || item.embedding;
    
    // Omitir vectores inválidos o con longitudes diferentes
    if (!vec || vec.length !== targetEmbedding.length) continue;

    const similarity = cosineSimilarity(targetEmbedding, vec);
    
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
        const sim = cosineSimilarity(candidate.vector, selectedItem.vector);
        if (sim > maxSimToSelected) {
          maxSimToSelected = sim;
        }
      }

      // Ecuación MMR: Lambda * Relevancia - (1 - Lambda) * Redundancia
      // Confiamos en diversityFactor para equilibrar esto.
      const mmrScore = (diversityFactor * candidate.similarity) - 
                       ((1 - diversityFactor) * maxSimToSelected);

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      // Agregar el mejor candidato a seleccionado
      selected.push(pool[bestIdx]);
      
      // Eliminación eficiente de array (Swap-Pop)
      // Reemplazar el elemento encontrado con el último, luego eliminar el último.
      // El orden no importa en el bucle del conjunto.
      pool[bestIdx] = pool[pool.length - 1];
      pool.pop();
    } else {
      break; 
    }
  }

  return selected.map(({ item, similarity }) => ({ item, similarity }));
}

export function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.9) return 'Muy alta';
  if (similarity >= 0.75) return 'Alta';
  if (similarity >= 0.6) return 'Media';
  if (similarity >= 0.4) return 'Baja';
  return 'Muy baja';
}

export function getSimilarityColor(similarity: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (similarity >= 0.9) {
    return {
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800'
    };
  }
  if (similarity >= 0.75) {
    return {
      text: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800'
    };
  }
  if (similarity >= 0.6) {
    return {
      text: 'text-yellow-700 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-800'
    };
  }
  return {
    text: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900',
    border: 'border-gray-200 dark:border-gray-700'
  };
}