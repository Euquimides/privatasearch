import React, { useState, useCallback } from "react";
import { useSearchIndex, ResolutionItem, ResultadoType, DESCRIPTOR_PATTERNS, RESULTADO_LABELS, RESULTADO_BADGE_CLASSES, TIPO_LABELS } from "@/context/SearchContext";
import { highlightText, buildQueryPatterns } from "@/utils/highlightText";
import { FileText, Search, ClipboardCopy, Check } from "lucide-react";
import { formatCitaCR, fmtFecha } from "@/utils/formatters";

/** Insignia de resultado: pastilla con punto, compartida con el panel de lectura. */
export function ResultadoBadge({ resultado, className = "" }: { resultado: ResultadoType; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${RESULTADO_BADGE_CLASSES[resultado] ?? RESULTADO_BADGE_CLASSES.otro} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {RESULTADO_LABELS[resultado]}
    </span>
  );
}

const ACTION_CLASSES =
  "inline-flex items-center justify-center gap-1.5 border border-neutral-200/80 bg-white rounded-lg px-3 min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 text-xs font-medium text-neutral-600 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors";

interface ResultCardProps {
  item: ResolutionItem;
  index: number;
  highlight: (text: string) => React.ReactNode;
  onOpen: (item: ResolutionItem) => void;
}

const ResultCard = React.memo(function ResultCard({ item, index, highlight, onOpen }: ResultCardProps) {
  const [citaCopied, setCitaCopied] = useState(false);

  const copiarCita = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatCitaCR(item)).then(() => {
      setCitaCopied(true);
      setTimeout(() => setCitaCopied(false), 2000);
    }).catch(() => {});
  }, [item]);

  const resultado = item.metadatos?.resultado;

  return (
    // La tarjeta completa es un atajo para el ratón; el control accesible es el título.
    <article
      className="group relative bg-white border border-neutral-200/80 rounded-xl transition-all hover:bg-neutral-50 hover:border-neutral-300 hover:-translate-y-px cursor-pointer dark:bg-neutral-900 dark:border-neutral-800/80 dark:hover:bg-neutral-800/60 dark:hover:border-neutral-700 animate-slide-up overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 4) * 0.05}s` }}
      onClick={() => onOpen(item)}
    >
      <div className="p-4 sm:p-5">
        {/* Fila superior: insignia + resolución + fecha */}
        <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
          {resultado && <ResultadoBadge resultado={resultado} />}
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {item.metadatos?.resolucion ?? ""}
          </span>
          <span className="flex-1" />
          {item.metadatos?.fecha && (
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {fmtFecha(item.metadatos.fecha)}
            </span>
          )}
        </div>

        {/* Título: única acción principal; el color de la tarjeta al pasar el cursor es la señal */}
        <h3 className="mb-2">
          <button
            type="button"
            aria-label={`Abrir resolución: ${item.titulo}`}
            onClick={(e) => { e.stopPropagation(); onOpen(item); }}
            className="text-left text-lg sm:text-xl font-medium leading-snug tracking-tight text-neutral-900 group-hover:text-blue-700 dark:text-neutral-100 dark:group-hover:text-blue-400 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
          >
            {highlight(item.titulo)}
          </button>
        </h3>

        {/* Resumen / vista previa */}
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3 sm:line-clamp-2">
          {highlight(item.texto.slice(0, 250))}
          {item.texto.length > 250 && "…"}
        </p>

        {/* Pie: tipo + acción rápida. Red de citas y PDF viven en el panel de lectura, no aquí. */}
        <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80">
          {item.metadatos?.tipo_procedimiento && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {TIPO_LABELS[item.metadatos.tipo_procedimiento] ?? item.metadatos.tipo_procedimiento}
            </span>
          )}
          <span className="flex-1" />
          <button
            onClick={copiarCita}
            title={citaCopied ? "¡Copiado!" : "Copiar cita"}
            className={`${ACTION_CLASSES} ${
              citaCopied ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : ""
            }`}
          >
            <span className="relative w-3.5 h-3.5">
              <ClipboardCopy className={`w-3.5 h-3.5 absolute inset-0 transition-all duration-150 ${citaCopied ? "opacity-0 scale-75" : "opacity-100 scale-100"}`} />
              <Check className={`w-3.5 h-3.5 absolute inset-0 transition-all duration-150 ${citaCopied ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
            </span>
            {citaCopied ? "Copiado" : "Citar"}
          </button>
        </div>
      </div>
    </article>
  );
});

const EJEMPLOS = ["consentimiento", "videovigilancia", "derecho de acceso"];

interface SearchResultsProps {
  query: string;
  limit: number;
  filteredItems: ResolutionItem[];
  isSearching?: boolean;
  highlightEnabled?: boolean;
  selectedDescriptores?: string[];
  page?: number;
  setPage?: (p: number) => void;
  totalItems?: number;
  onOpenItem?: (item: ResolutionItem) => void;
  onExampleQuery?: (q: string) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
}

export function SearchResults({
  query,
  limit,
  filteredItems,
  isSearching = false,
  highlightEnabled = true,
  selectedDescriptores = [],
  page = 1,
  setPage,
  totalItems = 0,
  onOpenItem,
  onExampleQuery,
  onClearFilters,
  activeFilterCount = 0,
}: SearchResultsProps) {
  const { indexReady } = useSearchIndex();

  const queryPatterns = React.useMemo(
    () => (highlightEnabled ? buildQueryPatterns(query) : []),
    [query, highlightEnabled],
  );
  const descriptorPatterns = React.useMemo(
    () => highlightEnabled
      ? DESCRIPTOR_PATTERNS.filter(([key]) => selectedDescriptores.includes(key)).map(([, pattern]) => pattern)
      : [],
    [selectedDescriptores, highlightEnabled],
  );

  const highlight = React.useCallback(
    (text: string) => highlightEnabled ? highlightText(text, queryPatterns, descriptorPatterns) : text,
    [highlightEnabled, queryPatterns, descriptorPatterns],
  );

  const allResults = isSearching ? filteredItems : [];

  const totalPages = Math.max(1, Math.ceil(allResults.length / limit));
  const safePage = Math.min(page, totalPages);

  const searchResults = React.useMemo(
    () => allResults.slice((safePage - 1) * limit, safePage * limit),
    [allResults, safePage, limit],
  );

  const goToPage = (p: number) => {
    setPage?.(p);
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  const pageItems = React.useMemo(() =>
    Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
        acc.push(p);
        return acc;
      }, []),
  [totalPages, safePage]);

  const handleOpenItem = React.useCallback((item: ResolutionItem) => {
    onOpenItem?.(item);
  }, [onOpenItem]);

  if (!indexReady) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-14 text-center">
        <div className="relative mb-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">Preparando el índice de resoluciones</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Este paso ocurre una sola vez; después las búsquedas son inmediatas.
        </p>
      </div>
    );
  }

  if (!isSearching) {
    return (
      <div className="py-10 sm:py-14 text-center">
        <FileText className="mx-auto mb-4 h-8 w-8 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
        <h2 className="mb-2 text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
          Busca en las resoluciones de PRODHAB
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
          Escribe una pregunta, un tema o un número de expediente como{" "}
          <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded px-1.5 py-0.5">138-07-2023-DEN</span>.
        </p>
        {onExampleQuery && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {EJEMPLOS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onExampleQuery(q)}
                className="inline-flex items-center min-h-9 px-3 border border-neutral-200/80 bg-white rounded-lg text-sm font-medium text-neutral-700 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-blue-400 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {totalItems > 0 && (
          <p className="mt-5 text-xs text-neutral-400 dark:text-neutral-600">
            {totalItems.toLocaleString("es-CR")} resoluciones disponibles
          </p>
        )}
      </div>
    );
  }

  if (isSearching && searchResults.length === 0) {
    return (
      <div className="py-10 sm:py-12 text-center">
        <Search className="mx-auto mb-4 h-8 w-8 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
        <h2 className="mb-1 text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
          {query ? <>Sin resultados para &laquo;{query}&raquo;</> : "Sin resultados con los filtros activos"}
        </h2>
        <div className="mt-5 text-left max-w-sm mx-auto space-y-2">
          <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Sugerencias</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Usar menos palabras, o una sola palabra clave.</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Bajar el control de <strong className="font-semibold">Precisión</strong> en el panel de filtros para ampliar los resultados.
          </p>
        </div>
        {onClearFilters && activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 inline-flex items-center min-h-11 px-4 border border-neutral-200/80 bg-white rounded-lg text-sm font-medium text-neutral-700 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-blue-400 transition-colors"
          >
            Quitar {activeFilterCount === 1 ? "el filtro" : `los ${activeFilterCount} filtros`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        <h2 className="sr-only">Resultados de búsqueda</h2>
        {searchResults.map((item, index) => (
          <ResultCard
            key={item.id}
            item={item}
            index={index}
            highlight={highlight}
            onOpen={handleOpenItem}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Paginación de resultados" className="mt-6">
          <div className="flex items-center justify-between gap-2 sm:hidden">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Página anterior"
              className="border border-neutral-200/80 bg-white rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-400"
            >
              ‹ Anterior
            </button>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              aria-label="Página siguiente"
              className="border border-neutral-200/80 bg-white rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-400"
            >
              Siguiente ›
            </button>
          </div>

          <div className="hidden sm:flex items-center justify-center gap-1">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Página anterior"
              className="border border-neutral-200/80 bg-white rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-400"
            >
              ‹ Anterior
            </button>
            <div className="flex items-center gap-1">
              {pageItems.map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm text-neutral-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    aria-current={p === safePage ? "page" : undefined}
                    className={`min-w-[2.25rem] border rounded-lg px-2.5 py-2 text-sm font-medium transition-all ${
                      p === safePage
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-neutral-200/80 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-400"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              aria-label="Página siguiente"
              className="border border-neutral-200/80 bg-white rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700/80 dark:bg-neutral-900 dark:text-neutral-400"
            >
              Siguiente ›
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
