// Precomputa las estadísticas del dataset en build (npm run build lo ejecuta vía prebuild).
// Genera public/estadisticas.json para que la página no descargue el índice completo (~28 MB).
import { readFileSync, writeFileSync } from "node:fs";
import { calculateStatistics } from "../src/utils/statisticsCalculator.ts";

const dataset = JSON.parse(readFileSync("public/indice-resoluciones-prodhab.json", "utf8"));
const stats = calculateStatistics(dataset);

// Registros con vector, en el mismo orden que los índices de members
const vecRecords = dataset.datos.filter((r) => Array.isArray(r.vector) && r.vector.length > 0);
const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));

// Recorta campos pesados que la página no usa
if (stats.clusterAnalysis) {
  for (const cluster of stats.clusterAnalysis.clusters) {
    // Títulos representativos: los 3 más cercanos al centro del grupo
    cluster.titulos = cluster.members
      .map((i) => ({ t: vecRecords[i].titulo, d: dist(vecRecords[i].vector, cluster.centroid) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map((x) => x.t)
      .filter(Boolean);
    delete cluster.centroid;
    delete cluster.members;
  }
  delete stats.clusterAnalysis.outlierIndices;
  for (const p of stats.clusterAnalysis.scatterData) {
    p.x = Math.round(p.x * 1e4) / 1e4;
    p.y = Math.round(p.y * 1e4) / 1e4;
    p.titulo = dataset.datos[p.recordIndex].titulo;
    delete p.recordIndex;
  }
}

writeFileSync("public/estadisticas.json", JSON.stringify(stats));
console.log(
  `estadisticas.json generado: ${stats.totalRecords} resoluciones, ${stats.clusterAnalysis?.numClusters ?? 0} grupos`,
);
