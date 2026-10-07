/**
 * Calculadora de estadísticas para el conjunto de resoluciones PRODHAB
 * Proporciona un análisis estadístico integral del conjunto de datos
 */

export interface DataRecord {
  id: string;
  metadatos: {
    expediente?: string;
    resolucion?: string;
    anio?: number | null;
    fecha?: string;
    hora?: string | null;
    lugar?: string | null;
    resultado?: string;
    tipo_procedimiento?: string | null;
    denunciante?: string | null;
    denunciado?: string;
    recurso_disponible?: string | null;
    firmante?: string;
    elaborado_por?: string | null;
    resoluciones_citadas?: string[];
    archivo_origen?: string;
  };
  titulo: string;
  secciones?: {
    resultando?: string;
    considerando?: string;
    por_tanto?: string;
  };
  texto: string;
  vector?: number[];
}

export interface Dataset {
  datos: DataRecord[];
}

interface BasicStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stddev: number;
}

export interface Cluster {
  id: number;
  // centroid y members se omiten en el JSON precomputado (scripts/generate-stats.mjs)
  centroid?: number[];
  members?: number[];
  size: number;
  // Títulos representativos (más cercanos al centro del grupo), solo en el JSON precomputado
  titulos?: string[];
}

export interface ScatterPoint {
  x: number;
  y: number;
  expediente: string;
  resolucion: string;
  clusterId: number;
  titulo?: string;
  recordIndex?: number;
}

export interface ClusterAnalysis {
  numClusters: number;
  clusters: Cluster[];
  outlierCount: number;
  outlierIndices?: number[];
  mostPopulated: { clusterId: number; size: number };
  leastPopulated: { clusterId: number; size: number };
  clusterDistributionOverTime: { [year: string]: { [clusterId: string]: number } };
  scatterData: ScatterPoint[];
}

export interface DatasetStatistics {
  totalRecords: number;
  uniqueExpedientes: number;
  recordsPerYear: { [year: string]: number };
  earliestDate: string | null;
  latestDate: string | null;
  resultadoDistribution: { [resultado: string]: number };
  clusterAnalysis: ClusterAnalysis | null;
}

// Tamaño mínimo de un grupo para que sea relevante en la estadística
const MIN_CLUSTER_SIZE = 5;

// Funciones auxiliares
function parseDate(dateStr: string): Date | null {
  // Formato: YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

function getYearFromDate(dateStr: string): string | null {
  const date = parseDate(dateStr);
  return date ? date.getFullYear().toString() : null;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calculateBasicStats(values: number[]): BasicStats {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stddev: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
  
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stddev = Math.sqrt(variance);
  
  return { min, max, mean, median, stddev };
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

// PRNG determinista (mulberry32): cada build genera los mismos grupos
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Inicialización k-means++: cada centroide nuevo se sortea con probabilidad proporcional
// a la distancia² al centroide más cercano. Tomar siempre el punto más lejano elegiría
// los casos atípicos como centros y produciría grupos de una sola resolución.
function kMeansPlusPlusInit(vectors: number[][], k: number, seed: number = 42): number[][] {
  const random = seededRandom(seed);
  const centroids = [[...vectors[Math.floor(random() * vectors.length)]]];
  const minDist2 = vectors.map(v => euclideanDistance(v, centroids[0]) ** 2);

  while (centroids.length < k && centroids.length < vectors.length) {
    const total = minDist2.reduce((a, b) => a + b, 0);
    if (total === 0) break;

    let r = random() * total;
    let idx = 0;
    while ((r -= minDist2[idx]) > 0 && idx < vectors.length - 1) idx++;

    const centroid = [...vectors[idx]];
    centroids.push(centroid);
    for (let i = 0; i < vectors.length; i++) {
      minDist2[i] = Math.min(minDist2[i], euclideanDistance(vectors[i], centroid) ** 2);
    }
  }

  return centroids;
}

// Implementación de agrupamiento K-means (Lloyd) a partir de centroides iniciales
function kMeansClustering(
  vectors: number[][],
  initialCentroids: number[][],
  maxIterations: number = 100
): { assignments: number[]; centroids: number[][] } {
  if (vectors.length === 0 || initialCentroids.length === 0) {
    return { assignments: [], centroids: [] };
  }

  const dimensions = vectors[0].length;
  const centroids = initialCentroids.map(c => [...c]);

  let assignments: number[] = new Array(vectors.length).fill(0);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Paso de asignación
    const newAssignments: number[] = [];
    for (const vector of vectors) {
      let minDist = Infinity;
      let closestCentroid = 0;
      
      for (let c = 0; c < centroids.length; c++) {
        const dist = euclideanDistance(vector, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          closestCentroid = c;
        }
      }
      
      newAssignments.push(closestCentroid);
    }
    
    // Verificar convergencia
    let changed = false;
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i] !== newAssignments[i]) {
        changed = true;
        break;
      }
    }
    
    assignments = newAssignments;
    
    if (!changed) break;
    
    // Paso de actualización
    for (let c = 0; c < centroids.length; c++) {
      const clusterVectors = vectors.filter((_, i) => assignments[i] === c);
      if (clusterVectors.length === 0) continue;
      
      const newCentroid = new Array(dimensions).fill(0);
      for (const v of clusterVectors) {
        for (let d = 0; d < dimensions; d++) {
          newCentroid[d] += v[d];
        }
      }
      for (let d = 0; d < dimensions; d++) {
        newCentroid[d] /= clusterVectors.length;
      }
      centroids[c] = newCentroid;
    }
  }
  
  return { assignments, centroids };
}

// Implementación simple de PCA para proyección 2D
function pca2D(vectors: number[][]): { x: number; y: number }[] {
  if (vectors.length === 0) return [];
  
  const n = vectors.length;
  const dims = vectors[0].length;
  
  // Calcular la media de cada dimensión
  const means: number[] = new Array(dims).fill(0);
  for (const v of vectors) {
    for (let d = 0; d < dims; d++) {
      means[d] += v[d];
    }
  }
  for (let d = 0; d < dims; d++) {
    means[d] /= n;
  }
  
  // Centrar los datos restando la media
  const centered = vectors.map(v => v.map((val, d) => val - means[d]));
  
  // Usar iteración de potencia para encontrar los dos primeros componentes principales
  // Este es un enfoque simplificado: proyectaremos en las dos dimensiones con mayor varianza
  const variances: { dim: number; variance: number }[] = [];
  for (let d = 0; d < dims; d++) {
    let variance = 0;
    for (const v of centered) {
      variance += v[d] * v[d];
    }
    variances.push({ dim: d, variance });
  }
  
  // Ordenar por varianza y tomar las dos principales dimensiones
  variances.sort((a, b) => b.variance - a.variance);
  const dim1 = variances[0].dim;
  const dim2 = variances[1].dim;
  
  // Proyectar en estas dos dimensiones
  return centered.map(v => ({ x: v[dim1], y: v[dim2] }));
}

// Detecta valores atípicos usando la distancia al centroide del clúster
function detectOutliers(
  vectors: number[][],
  assignments: number[],
  centroids: number[][],
  threshold: number = 2.0
): number[] {
  const outliers: number[] = [];
  
  // Calcula la distancia media para cada clúster
  const clusterDistances: { [key: number]: number[] } = {};
  for (let i = 0; i < vectors.length; i++) {
    const clusterId = assignments[i];
    const dist = euclideanDistance(vectors[i], centroids[clusterId]);
    if (!clusterDistances[clusterId]) {
      clusterDistances[clusterId] = [];
    }
    clusterDistances[clusterId].push(dist);
  }
  
  // Calcula la media y desviación estándar para cada clúster
  const clusterStats: { [key: number]: { mean: number; stddev: number } } = {};
  for (const [clusterId, distances] of Object.entries(clusterDistances)) {
    const stats = calculateBasicStats(distances);
    clusterStats[parseInt(clusterId)] = { mean: stats.mean, stddev: stats.stddev };
  }
  
  // Identifica valores atípicos
  for (let i = 0; i < vectors.length; i++) {
    const clusterId = assignments[i];
    const dist = euclideanDistance(vectors[i], centroids[clusterId]);
    const { mean, stddev } = clusterStats[clusterId];
    
    if (stddev > 0 && (dist - mean) / stddev > threshold) {
      outliers.push(i);
    }
  }
  
  return outliers;
}

export function calculateStatistics(dataset: Dataset): DatasetStatistics {
  const { datos } = dataset;

  const totalRecords = datos.length;
  const expedientes = new Set<string>();
  const recordsPerYear: { [year: string]: number } = {};
  const resultadoDistribution: { [resultado: string]: number } = {};

  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;

  const allVectors: number[][] = [];
  const recordDates: (string | null)[] = [];
  const vectorToRecordMap: number[] = []; // Mapea índice de vector al índice del registro original

  for (let recordIdx = 0; recordIdx < datos.length; recordIdx++) {
    const record = datos[recordIdx];
    const meta = record.metadatos || {};

    if (meta.expediente) expedientes.add(meta.expediente);

    // Fecha
    if (meta.fecha) {
      const date = parseDate(meta.fecha);
      const year = getYearFromDate(meta.fecha);
      recordDates.push(year);

      if (date) {
        if (!earliestDate || date < earliestDate) earliestDate = date;
        if (!latestDate || date > latestDate) latestDate = date;
        if (year) recordsPerYear[year] = (recordsPerYear[year] || 0) + 1;
      }
    } else {
      recordDates.push(null);
    }

    if (meta.resultado) {
      resultadoDistribution[meta.resultado] = (resultadoDistribution[meta.resultado] || 0) + 1;
    }

    if (record.vector && Array.isArray(record.vector) && record.vector.length > 0) {
      allVectors.push(record.vector);
      vectorToRecordMap.push(recordIdx);
    }
  }

  // Análisis de agrupamiento
  let clusterAnalysis: ClusterAnalysis | null = null;
  
  if (allVectors.length > 10) {
    // Número inicial de clústeres: regla empírica sqrt(n/2), con tope de 8
    const initialK = Math.min(8, Math.ceil(Math.sqrt(allVectors.length / 2)));

    let { assignments, centroids } = kMeansClustering(allVectors, kMeansPlusPlusInit(allVectors, initialK));

    // Descarta los grupos con menos de MIN_CLUSTER_SIZE resoluciones y reagrupa con los
    // centroides restantes, hasta que todos los grupos tengan tamaño suficiente
    for (;;) {
      const sizes = new Array(centroids.length).fill(0);
      for (const a of assignments) sizes[a]++;
      const kept = centroids.filter((_, c) => sizes[c] >= MIN_CLUSTER_SIZE);
      if (kept.length === 0 || kept.length === centroids.length) break;
      ({ assignments, centroids } = kMeansClustering(allVectors, kept));
    }
    const numClusters = centroids.length;
    const outlierIndices = detectOutliers(allVectors, assignments, centroids);
    
    // Construye la información de los clústeres
    const clusters: Cluster[] = [];
    for (let c = 0; c < centroids.length; c++) {
      const members = assignments
        .map((a, i) => a === c ? i : -1)
        .filter(i => i !== -1);
      
      clusters.push({
        id: c,
        centroid: centroids[c],
        members,
        size: members.length,
      });
    }
    
    // Encuentra el más y el menos poblado
    const sortedBySize = [...clusters].sort((a, b) => b.size - a.size);
    const mostPopulated = { clusterId: sortedBySize[0].id, size: sortedBySize[0].size };
    const leastPopulated = {
      clusterId: sortedBySize[sortedBySize.length - 1].id,
      size: sortedBySize[sortedBySize.length - 1].size,
    };
    
    // Distribución de clústeres a lo largo del tiempo
    const clusterDistributionOverTime: { [year: string]: { [clusterId: string]: number } } = {};
    
    for (let i = 0; i < assignments.length; i++) {
      const recordIdx = vectorToRecordMap[i];
      const year = recordDates[recordIdx];
      if (year) {
        if (!clusterDistributionOverTime[year]) {
          clusterDistributionOverTime[year] = {};
        }
        const clusterId = assignments[i].toString();
        clusterDistributionOverTime[year][clusterId] = 
          (clusterDistributionOverTime[year][clusterId] || 0) + 1;
      }
    }
    
    // Genera la proyección 2D para el diagrama de dispersión
    const projection2D = pca2D(allVectors);
    
    // Construye los datos de dispersión con metadatos
    const scatterData: ScatterPoint[] = [];
    for (let i = 0; i < assignments.length; i++) {
      const recordIdx = vectorToRecordMap[i];
      const record = datos[recordIdx];
      const meta = record.metadatos || {};
      
      scatterData.push({
        x: projection2D[i].x,
        y: projection2D[i].y,
        expediente: meta.expediente || 'N/A',
        resolucion: meta.resolucion || 'N/A',
        clusterId: assignments[i],
        recordIndex: recordIdx,
      });
    }
    
    clusterAnalysis = {
      numClusters,
      clusters,
      outlierCount: outlierIndices.length,
      outlierIndices,
      mostPopulated,
      leastPopulated,
      clusterDistributionOverTime,
      scatterData,
    };
  }
  
  return {
    totalRecords,
    uniqueExpedientes: expedientes.size,
    recordsPerYear,
    // ISO YYYY-MM-DD (fecha local, sin pasar por UTC): la página extrae el año con slice(0, 4)
    earliestDate: earliestDate ? toIsoDate(earliestDate) : null,
    latestDate: latestDate ? toIsoDate(latestDate) : null,
    clusterAnalysis,
    resultadoDistribution,
  };
}
