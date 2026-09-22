"use client";
import React from "react";
import { Filter, Calendar, Tag, Highlighter, ListOrdered } from "lucide-react";
import {
  DESCRIPTOR_LABELS,
  RESULTADO_LABELS,
  TIPO_LABELS,
  ResultadoType,
  TipoProcedimientoType,
} from "@/context/SearchContext";

interface SearchConfigPanelProps {
  limit: number;
  setLimit: (value: number) => void;
  similarityThreshold: number;
  setSimilarityThreshold: (value: number) => void;
  relatedLimit: number;
  setRelatedLimit: (value: number) => void;
  yearFrom: number | null;
  setYearFrom: (value: number | null) => void;
  yearTo: number | null;
  setYearTo: (value: number | null) => void;
  availableYears: number[];
  selectedDescriptores: string[];
  setSelectedDescriptores: (value: string[]) => void;
  descriptorCounts: Record<string, number>;
  highlightEnabled: boolean;
  setHighlightEnabled: (value: boolean) => void;
  selectedResultados: ResultadoType[];
  setSelectedResultados: (value: ResultadoType[]) => void;
  selectedTipos: TipoProcedimientoType[];
  setSelectedTipos: (value: TipoProcedimientoType[]) => void;
  isSearching: boolean;
}

export function SearchConfigPanel({
  limit,
  setLimit,
  similarityThreshold,
  setSimilarityThreshold,
  relatedLimit,
  setRelatedLimit,
  yearFrom,
  setYearFrom,
  yearTo,
  setYearTo,
  availableYears,
  selectedDescriptores,
  setSelectedDescriptores,
  descriptorCounts,
  highlightEnabled,
  setHighlightEnabled,
  selectedResultados,
  setSelectedResultados,
  selectedTipos,
  setSelectedTipos,
  isSearching,
}: SearchConfigPanelProps) {
  const [mobileExpanded, setMobileExpanded] = React.useState(false);

  const handleReset = () => {
    setLimit(10);
    setSimilarityThreshold(0.5);
    setRelatedLimit(5);
    setYearFrom(null);
    setYearTo(null);
    setSelectedDescriptores([]);
    setSelectedResultados([]);
    setSelectedTipos([]);
  };

  const toggleDescriptor = (key: string) => {
    setSelectedDescriptores(
      selectedDescriptores.includes(key)
        ? selectedDescriptores.filter((d) => d !== key)
        : [...selectedDescriptores, key],
    );
  };

  const sortedDescriptores = React.useMemo(
    () =>
      Object.entries(DESCRIPTOR_LABELS)
        .map(([key, label]) => ({ key, label, count: descriptorCounts[key] ?? 0 }))
        .filter(({ count, key }) => count > 0 || selectedDescriptores.includes(key))
        .sort((a, b) => b.count - a.count),
    [descriptorCounts, selectedDescriptores],
  );

  const toggleResultado = (key: ResultadoType) => {
    setSelectedResultados(
      selectedResultados.includes(key)
        ? selectedResultados.filter((r) => r !== key)
        : [...selectedResultados, key],
    );
  };

  const toggleTipo = (key: TipoProcedimientoType) => {
    setSelectedTipos(
      selectedTipos.includes(key)
        ? selectedTipos.filter((t) => t !== key)
        : [...selectedTipos, key],
    );
  };

  const hasActiveFilters =
    limit !== 10 || yearFrom !== null || yearTo !== null ||
    selectedDescriptores.length > 0 || selectedResultados.length > 0 || selectedTipos.length > 0;

  const activeCount =
    (yearFrom !== null || yearTo !== null ? 1 : 0) +
    selectedDescriptores.length + selectedResultados.length + selectedTipos.length +
    (limit !== 10 ? 1 : 0);

  const filterContent = (
    <div className="space-y-5">
      {/* Rango de fechas */}
      <fieldset>
        <legend className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          Período
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="year-from" className="sr-only">Desde el año</label>
            <select
              id="year-from"
              value={yearFrom ?? ""}
              onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-neutral-200/80 bg-white rounded-lg px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="">Desde…</option>
              {availableYears.map((y) => (
                <option key={y} value={y} disabled={yearTo !== null && y > yearTo}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="year-to" className="sr-only">Hasta el año</label>
            <select
              id="year-to"
              value={yearTo ?? ""}
              onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-neutral-200/80 bg-white rounded-lg px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="">Hasta…</option>
              {availableYears.map((y) => (
                <option key={y} value={y} disabled={yearFrom !== null && y < yearFrom}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Resultado */}
      <fieldset>
        <legend className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          <Tag className="h-3.5 w-3.5" aria-hidden="true" />
          Resultado
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(RESULTADO_LABELS) as ResultadoType[]).map((key) => {
            const active = selectedResultados.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleResultado(key)}
                aria-pressed={active}
                className={`inline-flex items-center border rounded-lg px-3 py-2.5 sm:px-2.5 sm:py-1.5 text-xs font-medium transition-all active:scale-95 ${
                  active
                    ? "border-blue-400/80 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-600"
                    : "border-neutral-200/80 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500"
                }`}
              >
                {RESULTADO_LABELS[key]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Tipo de procedimiento */}
      <fieldset>
        <legend className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Tipo de procedimiento
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TIPO_LABELS) as TipoProcedimientoType[]).map((key) => {
            const active = selectedTipos.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleTipo(key)}
                aria-pressed={active}
                className={`inline-flex items-center border rounded-lg px-3 py-2.5 sm:px-2.5 sm:py-1.5 text-xs font-medium transition-all active:scale-95 ${
                  active
                    ? "border-blue-400/80 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-600"
                    : "border-neutral-200/80 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500"
                }`}
              >
                {TIPO_LABELS[key]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Resultados por página */}
      <div>
        <label htmlFor="result-limit" className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
          Por página
        </label>
        <select
          id="result-limit"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-full border border-neutral-200/80 bg-white rounded-lg px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* Descriptores */}
      {isSearching && sortedDescriptores.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              Tema jurídico
            </span>
            {selectedDescriptores.length > 0 && (
              <button
                onClick={() => setSelectedDescriptores([])}
                className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortedDescriptores.map(({ key, label, count }) => {
              const active = selectedDescriptores.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleDescriptor(key)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-2.5 sm:px-2.5 sm:py-1.5 text-xs font-medium transition-all active:scale-95 ${
                    active
                      ? "border-indigo-400/80 bg-indigo-500 text-white dark:border-indigo-400 dark:bg-indigo-600"
                      : "border-neutral-200/80 bg-white text-neutral-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                  }`}
                >
                  <span>{label}</span>
                  <span className={`px-1 py-px text-[11px] font-bold tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Separador */}
      <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

      {/* Control de precisión */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="similarity-threshold" className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Precisión
          </label>
          <span className="bg-blue-500 rounded-md px-2 py-0.5 text-xs font-bold text-white tabular-nums">
            {(similarityThreshold * 100).toFixed(0)}%
          </span>
        </div>
        <input
          id="similarity-threshold"
          type="range"
          min={0}
          max={100}
          value={similarityThreshold * 100}
          onChange={(e) => setSimilarityThreshold(Number(e.target.value) / 100)}
          className="h-2 w-full cursor-pointer appearance-none transition-all [accent-color:var(--primary)]"
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${similarityThreshold * 100}%, var(--slider-track-empty) ${similarityThreshold * 100}%, var(--slider-track-empty) 100%)`,
          }}
        />
        <div className="mt-1 flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <span>Más resultados</span>
          <span>Más precisos</span>
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">Qué tan cercana debe ser la coincidencia con tu búsqueda.</p>
      </div>

      {/* Límite de relacionadas */}
      <div>
        <label htmlFor="related-limit" className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Relacionadas
        </label>
        <p className="mb-2 text-[11px] text-neutral-500 dark:text-neutral-400">Cuántas resoluciones similares mostrar al abrir un resultado.</p>
        <div className="flex gap-2">
          {[3, 5, 10].map((n) => (
            <button
              key={n}
              onClick={() => setRelatedLimit(n)}
              className={`flex-1 border rounded-lg px-2 py-2.5 sm:py-1.5 text-xs font-medium transition-all ${
                relatedLimit === n
                  ? "border-blue-400/80 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                  : "border-neutral-200/80 bg-white text-neutral-500 hover:border-neutral-300 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Alternar resaltado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Highlighter className="h-4 w-4 flex-shrink-0 text-neutral-400" aria-hidden="true" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Resaltado</span>
        </div>
        <button
          role="switch"
          aria-checked={highlightEnabled}
          onClick={() => setHighlightEnabled(!highlightEnabled)}
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
        >
          <span className={`relative inline-flex h-5 w-9 items-center rounded-full border-2 border-transparent transition-colors ${
            highlightEnabled ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-600"
          }`}>
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
              highlightEnabled ? "translate-x-4" : "translate-x-0.5"
            }`} />
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Móvil: botón colapsable */}
      <button
        onClick={() => setMobileExpanded(!mobileExpanded)}
        className="lg:hidden w-full flex items-center justify-between border border-neutral-200/80 bg-white rounded-xl px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800/80 dark:bg-neutral-900 dark:hover:bg-neutral-800/60 mb-3"
      >
        <div className="flex items-center gap-2.5">
          <Filter className={`h-4 w-4 flex-shrink-0 ${mobileExpanded ? "text-blue-600 dark:text-blue-400" : "text-neutral-400"}`} />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filtros</span>
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center bg-blue-500 rounded-full px-1.5 text-[11px] font-semibold tabular-nums text-white">
              {activeCount}
            </span>
          )}
        </div>
        <svg className={`h-4 w-4 text-neutral-400 transition-transform ${mobileExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Móvil: contenido expandido */}
      {mobileExpanded && (
        <div className="lg:hidden border border-neutral-200/80 bg-white rounded-xl dark:border-neutral-800/80 dark:bg-neutral-900 p-4 mb-3 animate-slide-down">
          {filterContent}
          <div className="flex items-center mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800" style={{ justifyContent: hasActiveFilters ? "space-between" : "flex-end" }}>
            {hasActiveFilters && (
              <button onClick={handleReset} className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
                Limpiar
              </button>
            )}
            <button
              onClick={() => setMobileExpanded(false)}
              className="bg-blue-500 rounded-lg px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Escritorio: barra lateral siempre visible */}
      <div className="hidden lg:block border border-neutral-200/80 bg-white rounded-xl dark:border-neutral-800/80 dark:bg-neutral-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            <Filter className="h-4 w-4 text-neutral-400" />
            Filtros
          </span>
          {hasActiveFilters && (
            <button onClick={handleReset} className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
              Limpiar
            </button>
          )}
        </div>
        {filterContent}
      </div>
    </div>
  );
}
