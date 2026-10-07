"use client";

import { useEffect, useState, useCallback } from "react";
import Footer from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { DatasetStatistics } from "@/utils/statisticsCalculator";
import { RESULTADO_COLORS, RESULTADO_LABELS, ResultadoType } from "@/context/SearchContext";

// Colores por rango de tamaño del grupo (no por id: los ids cambian al regenerar las estadísticas)
const GROUP_COLORS = ["#2563eb", "#ea580c", "#0d9488", "#9333ea", "#db2777", "#ca8a04", "#64748b", "#94a3b8"];

const card = "bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl";
const lead = "text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400";
const h2 = "text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100";

// Lienzo del mapa (relación 16:11)
const MAP_W = 1000;
const MAP_H = 688;
const MAP_PAD = 16;

export default function EstadisticasPage() {
  const [stats, setStats] = useState<DatasetStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/estadisticas.json");
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      setStats((await response.json()) as DatasetStatistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Cargando estadísticas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="border border-red-200/80 bg-red-50 rounded-xl p-6 text-center dark:border-red-800/80 dark:bg-red-900/30">
          <p className="font-medium text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 rounded-lg text-white text-sm font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const fmt = (n: number) => n.toLocaleString("es-CR");
  const pct = (n: number) => ((n / stats.totalRecords) * 100).toFixed(1);
  const ca = stats.clusterAnalysis;
  const years = Object.keys(stats.recordsPerYear).sort();
  const peakYear = years.reduce((a, b) => (stats.recordsPerYear[b] > stats.recordsPerYear[a] ? b : a));
  const maxYear = stats.recordsPerYear[peakYear];

  const groups = ca
    ? [...ca.clusters]
        .sort((a, b) => b.size - a.size)
        .map((c, rank) => ({ ...c, n: c.id + 1, color: GROUP_COLORS[rank % GROUP_COLORS.length] }))
    : [];
  const colorOf = Object.fromEntries(groups.map((g) => [g.id, g.color]));
  const dimmed = (id: number) => focus !== null && focus !== id;

  const r = stats.resultadoDistribution;
  const resultados = (Object.keys(r) as ResultadoType[]).sort((a, b) => r[b] - r[a]);
  const acogidas = (r.con_lugar ?? 0) + (r.parcialmente_con_lugar ?? 0);

  // Escala de la proyección 2D al lienzo del mapa
  const pts = ca?.scatterData ?? [];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sx = (x: number) => MAP_PAD + ((x - x0) / (x1 - x0 || 1)) * (MAP_W - 2 * MAP_PAD);
  const sy = (y: number) => MAP_PAD + ((y1 - y) / (y1 - y0 || 1)) * (MAP_H - 2 * MAP_PAD);
  const hovered = hover !== null ? pts[hover] : null;

  const kpis = [
    { value: fmt(stats.totalRecords), label: "resoluciones" },
    { value: fmt(stats.uniqueExpedientes), label: "expedientes únicos" },
    ...(ca ? [{ value: fmt(ca.numClusters), label: `grupos temáticos · ${fmt(ca.outlierCount)} casos atípicos` }] : []),
    { value: `${Math.round((acogidas / stats.totalRecords) * 100)}%`, label: `con lugar, total o parcial (${fmt(acogidas)})` },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <SiteHeader subtitle="Estadísticas" />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full flex flex-col gap-12 sm:gap-14">
        {/* Encabezado + cifras clave */}
        <section className="flex flex-col gap-7">
          <div className="flex flex-col gap-3 max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Resoluciones anonimizadas · {stats.earliestDate?.slice(0, 4) ?? "N/A"}–{stats.latestDate?.slice(0, 4) ?? "N/A"}
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Estadísticas del conjunto de datos
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              Qué resuelve la PRODHAB, cuánto y sobre qué temas. Las resoluciones se agrupan
              automáticamente por similitud de su texto; cada grupo se describe con los títulos de sus
              casos más representativos.
            </p>
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className={`${card} px-5 py-4 flex flex-col-reverse gap-1`}>
                <dt className="text-sm text-neutral-500 dark:text-neutral-400">{k.label}</dt>
                <dd className="font-mono text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100">{k.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {ca && (
          <>
            {/* Mapa temático */}
            <section aria-labelledby="h-mapa" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1.5 max-w-2xl">
                  <h2 id="h-mapa" className={h2}>Mapa temático</h2>
                  <p className={lead}>
                    Cada punto es una resolución; las cercanas tratan asuntos parecidos. Pase el cursor
                    sobre un punto para leer su título, o elija un grupo para aislarlo.
                  </p>
                </div>
                {focus !== null && (
                  <button
                    type="button"
                    onClick={() => setFocus(null)}
                    className="min-h-11 px-4 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Mostrar todos los grupos
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className={`${card} p-3 sm:p-4 flex-1 min-w-0`}>
                  <svg
                    viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                    className="w-full h-auto"
                    role="img"
                    aria-label={`Mapa de dispersión de ${fmt(pts.length)} resoluciones agrupadas por similitud temática`}
                    onMouseLeave={() => setHover(null)}
                  >
                    {pts.map((p, i) => (
                      <circle
                        key={i}
                        cx={sx(p.x)}
                        cy={sy(p.y)}
                        r={hover === i ? 9 : 6}
                        fill={colorOf[p.clusterId]}
                        fillOpacity={dimmed(p.clusterId) ? 0.08 : 0.85}
                        className="stroke-white dark:stroke-neutral-900 cursor-pointer"
                        strokeWidth={1.5}
                        onMouseEnter={() => setHover(i)}
                        onClick={() => setHover(i)}
                      >
                        <title>{p.titulo ?? p.expediente}</title>
                      </circle>
                    ))}
                  </svg>
                </div>

                <aside aria-label="Detalle del mapa" className="lg:w-80 flex flex-col gap-4">
                  <div aria-live="polite" className="rounded-xl bg-neutral-900 dark:bg-neutral-800 text-neutral-100 p-5 min-h-36 flex flex-col gap-2.5">
                    {hovered ? (
                      <>
                        <p className="flex items-center gap-2 font-mono text-xs tracking-wide text-neutral-400">
                          <span className="size-2.5 rounded-full shrink-0" style={{ background: colorOf[hovered.clusterId] }} aria-hidden="true" />
                          GRUPO {hovered.clusterId + 1} · EXP. {hovered.expediente}
                        </p>
                        <p className="text-lg leading-snug font-semibold">{hovered.titulo ?? hovered.expediente}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-mono text-xs tracking-wide text-neutral-400">RESOLUCIÓN</p>
                        <p className="leading-relaxed text-neutral-300">
                          Pase el cursor sobre un punto del mapa para ver de qué trata.
                        </p>
                      </>
                    )}
                  </div>

                  <div className={`${card} p-2 flex flex-col`}>
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        aria-pressed={focus === g.id}
                        onClick={() => setFocus(focus === g.id ? null : g.id)}
                        className={`min-h-11 px-3 rounded-lg flex items-center gap-3 text-[15px] text-neutral-900 dark:text-neutral-100 transition-opacity hover:bg-neutral-100 dark:hover:bg-neutral-800 ${focus === g.id ? "bg-blue-50 dark:bg-blue-950/50" : ""} ${dimmed(g.id) ? "opacity-55" : ""}`}
                      >
                        <span className="size-2.5 rounded-full shrink-0" style={{ background: g.color }} aria-hidden="true" />
                        <span className="flex-1 text-left font-semibold">Grupo {g.n}</span>
                        <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400">{fmt(g.size)}</span>
                      </button>
                    ))}
                  </div>
                </aside>
              </div>
            </section>

            {/* Grupos */}
            <section aria-labelledby="h-grupos" className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 max-w-2xl">
                <h2 id="h-grupos" className={h2}>Los grupos, en sus propias palabras</h2>
                <p className={lead}>
                  Los grupos no tienen nombre oficial. Estos son los títulos de las resoluciones más
                  cercanas al centro de cada uno, con su evolución anual.
                </p>
              </div>
              <div className={`${card} overflow-x-auto`}>
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-neutral-800/80 font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      <th scope="col" className="py-3 px-5 font-normal w-32">Grupo</th>
                      <th scope="col" className="py-3 px-5 font-normal">Temas representativos</th>
                      <th scope="col" className="py-3 px-5 font-normal w-40">Resoluciones</th>
                      <th scope="col" className="py-3 px-5 font-normal w-44">{years[0]} → {years[years.length - 1]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => {
                      const counts = years.map((y) => ca.clusterDistributionOverTime[y]?.[g.id] ?? 0);
                      const max = Math.max(...counts, 1);
                      const [first, ...rest] = g.titulos ?? [];
                      return (
                        <tr key={g.id} className={`border-b last:border-0 border-neutral-100 dark:border-neutral-800/80 align-top transition-opacity ${dimmed(g.id) ? "opacity-40" : ""}`}>
                          <th scope="row" className="py-4 px-5 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                            <span className="inline-block size-2.5 rounded-full mr-2.5" style={{ background: g.color }} aria-hidden="true" />
                            Grupo {g.n}
                          </th>
                          <td className="py-4 px-5">
                            {first ? (
                              <ul className="flex flex-col gap-1">
                                <li className="text-[15px] leading-snug font-medium text-neutral-900 dark:text-neutral-100">{first}</li>
                                {rest.map((t) => (
                                  <li key={t} className="text-sm leading-snug text-neutral-500 dark:text-neutral-400">{t}</li>
                                ))}
                              </ul>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <p className="font-mono text-[15px] text-neutral-900 dark:text-neutral-100">
                              {fmt(g.size)} <span className="text-neutral-500 dark:text-neutral-400">· {pct(g.size)}%</span>
                            </p>
                            <div className="mt-2 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden" aria-hidden="true">
                              <div className="h-full" style={{ width: `${Math.max((g.size / groups[0].size) * 100, 1.5)}%`, background: g.color }} />
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-end gap-0.5 h-9" role="img" aria-label={years.map((y, i) => `${y}: ${counts[i]}`).join(", ")}>
                              {counts.map((v, i) => (
                                <div
                                  key={years[i]}
                                  title={`${years[i]}: ${v}`}
                                  className={`flex-1 rounded-sm ${v ? "" : "bg-neutral-200 dark:bg-neutral-800"}`}
                                  style={{ height: v ? `${Math.max((v / max) * 36, 3)}px` : "1px", background: v ? g.color : undefined }}
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* Resoluciones por año, apiladas por grupo */}
        <section aria-labelledby="h-anios" className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <h2 id="h-anios" className={h2}>Resoluciones por año</h2>
            <p className={lead}>
              {peakYear} es el año con más resoluciones publicadas ({fmt(maxYear)}).
              {ca && " Cada barra se divide por grupo temático."}
            </p>
          </div>
          <div className={`${card} px-4 sm:px-6 pt-6 pb-4 overflow-x-auto`}>
            <div
              role="img"
              aria-label={`Resoluciones por año: ${years.map((y) => `${y}: ${stats.recordsPerYear[y]}`).join(", ")}`}
              className="min-w-[480px]"
            >
              <div className="flex items-end gap-2 sm:gap-3 h-72 border-b border-neutral-300 dark:border-neutral-700">
                {years.map((y) => (
                  <div key={y} className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <span className="text-center font-mono text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">{fmt(stats.recordsPerYear[y])}</span>
                    <div className="flex flex-col-reverse gap-px">
                      {ca ? (
                        groups
                          .filter((g) => ca.clusterDistributionOverTime[y]?.[g.id])
                          .map((g) => {
                            const v = ca.clusterDistributionOverTime[y][g.id];
                            return (
                              <div
                                key={g.id}
                                title={`Grupo ${g.n} · ${y}: ${v}`}
                                className="transition-opacity"
                                style={{ height: `${Math.max((v / maxYear) * 240, 2)}px`, background: g.color, opacity: dimmed(g.id) ? 0.12 : 1 }}
                              />
                            );
                          })
                      ) : (
                        <div className="bg-blue-600" style={{ height: `${(stats.recordsPerYear[y] / maxYear) * 240}px` }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 sm:gap-3 pt-2.5">
                {years.map((y) => (
                  <span key={y} className="flex-1 text-center font-mono text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">{y}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Resultado */}
        <section aria-labelledby="h-res" className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <h2 id="h-res" className={h2}>Cómo se resuelven</h2>
            <p className={lead}>Distribución de las resoluciones según su resultado.</p>
          </div>
          <div className={`${card} p-5 sm:p-6 flex flex-col gap-5`}>
            <div
              role="img"
              aria-label={`Resultado de las resoluciones: ${resultados.map((k) => `${RESULTADO_LABELS[k] ?? k} ${r[k]}`).join(", ")}`}
              className="flex gap-0.5 h-7 rounded-md overflow-hidden"
            >
              {resultados.map((k) => (
                <div key={k} title={RESULTADO_LABELS[k] ?? k} className="min-w-1" style={{ flex: `${r[k]} 1 0`, background: RESULTADO_COLORS[k] ?? "#a3a3a3" }} />
              ))}
            </div>
            <ul>
              {resultados.map((k) => (
                <li key={k} className="flex items-center gap-3 py-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[15px] text-neutral-900 dark:text-neutral-100">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: RESULTADO_COLORS[k] ?? "#a3a3a3" }} aria-hidden="true" />
                  <span className="flex-1">{RESULTADO_LABELS[k] ?? k}</span>
                  <span className="font-mono text-sm">{fmt(r[k])}</span>
                  <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400 w-14 text-right">{pct(r[k])}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-3xl border-t border-neutral-200 dark:border-neutral-800 pt-5">
          Agrupación exploratoria por similitud de texto; no es una clasificación legal oficial. Títulos
          generados automáticamente a partir de cada resolución.
        </p>
      </main>
      <Footer />
    </div>
  );
}
