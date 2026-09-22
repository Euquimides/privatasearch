"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Image from "next/image";
import {
  useSearchIndex,
  DESCRIPTOR_LABELS,
  RESULTADO_LABELS,
  TIPO_LABELS,
  ResultadoType,
  TipoProcedimientoType,
  ResolutionItem,
} from "@/context/SearchContext";
import { SearchConfigPanel } from "./SearchConfigPanel";
import { SearchResults } from "./SearchResults";
import { ReaderOverlay } from "./ReaderOverlay";
import { DarkModeToggle } from "./DarkModeToggle";
import { useDebounce } from "@/utils/hooks";

const HISTORY_KEY = "ps_search_history";
const MAX_HISTORY = 8;

function parseHashParams(): URLSearchParams {
  const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  return new URLSearchParams(hash);
}

function writeHashParams(params: Record<string, string | null>) {
  const hp = parseHashParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === "") hp.delete(k);
    else hp.set(k, v);
  }
  const str = hp.toString();
  window.history.replaceState(null, "", str ? `#${str}` : window.location.pathname + window.location.search);
}

export default function SearchClient() {
  const initialHash = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return parseHashParams();
  }, []);

  const [query, setQuery] = useState(() => initialHash.get("q") ?? "");
  const [limit, setLimit] = useState(10);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  const [relatedLimit, setRelatedLimit] = useState(5);
  const [yearFrom, setYearFrom] = useState<number | null>(() => {
    const v = initialHash.get("desde");
    return v ? Number(v) : null;
  });
  const [yearTo, setYearTo] = useState<number | null>(() => {
    const v = initialHash.get("hasta");
    return v ? Number(v) : null;
  });
  const [selectedDescriptores, setSelectedDescriptores] = useState<string[]>(() => {
    const v = initialHash.get("temas");
    return v ? v.split(",").filter(Boolean) : [];
  });
  const [selectedResultados, setSelectedResultados] = useState<ResultadoType[]>(() => {
    const v = initialHash.get("resultado");
    return v ? (v.split(",").filter(Boolean) as ResultadoType[]) : [];
  });
  const [selectedTipos, setSelectedTipos] = useState<TipoProcedimientoType[]>(() => {
    const v = initialHash.get("tipo");
    return v ? (v.split(",").filter(Boolean) as TipoProcedimientoType[]) : [];
  });
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [page, setPage] = useState(() => {
    const v = initialHash.get("pag");
    return v ? Number(v) : 1;
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);

  // Estado del panel de lectura
  const [selectedItem, setSelectedItem] = useState<ResolutionItem | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayClosing, setOverlayClosing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const { allItems, search, searchResults, error } = useSearchIndex();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setSearchHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    writeHashParams({
      q: debouncedQuery || null,
      desde: yearFrom?.toString() ?? null,
      hasta: yearTo?.toString() ?? null,
      temas: selectedDescriptores.length > 0 ? selectedDescriptores.join(",") : null,
      resultado: selectedResultados.length > 0 ? selectedResultados.join(",") : null,
      tipo: selectedTipos.length > 0 ? selectedTipos.join(",") : null,
      pag: page > 1 ? page.toString() : null,
    });
  }, [debouncedQuery, yearFrom, yearTo, selectedDescriptores, selectedResultados, selectedTipos, page]);

  const closeOverlay = useCallback(() => {
    setOverlayClosing(true);
    setTimeout(() => {
      setOverlayOpen(false);
      setOverlayClosing(false);
    }, 180);
  }, []);

  // Atajos de teclado: / para enfocar búsqueda, Esc para cerrar panel o limpiar consulta
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement || (document.activeElement as HTMLElement)?.isContentEditable)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (overlayOpen && !overlayClosing) {
          closeOverlay();
        } else if (document.activeElement === inputRef.current && query) {
          setQuery("");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [overlayOpen, overlayClosing, closeOverlay, query]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allItems.forEach((item) => {
      const y = item.metadatos?.anio;
      if (y) years.add(y);
    });
    return Array.from(years).sort();
  }, [allItems]);

  // Con filtros activos la lista funciona aunque no haya consulta de texto
  const hasActiveFilters =
    selectedDescriptores.length > 0 ||
    selectedResultados.length > 0 ||
    selectedTipos.length > 0 ||
    yearFrom !== null ||
    yearTo !== null;
  const isSearching = debouncedQuery.length > 0 || hasActiveFilters;

  const activeFilterCount =
    selectedDescriptores.length +
    selectedResultados.length +
    selectedTipos.length +
    (yearFrom !== null || yearTo !== null ? 1 : 0);

  const clearFilters = useCallback(() => {
    setSelectedDescriptores([]);
    setSelectedResultados([]);
    setSelectedTipos([]);
    setYearFrom(null);
    setYearTo(null);
  }, []);

  const dateFilteredResults = useMemo(() => {
    // Sin consulta, los filtros operan sobre el corpus completo
    const base = debouncedQuery ? searchResults : allItems;
    if (!yearFrom && !yearTo) return base;
    return base.filter((item) => {
      const y = item.metadatos?.anio;
      if (!y) return true;
      if (yearFrom && y < yearFrom) return false;
      if (yearTo && y > yearTo) return false;
      return true;
    });
  }, [searchResults, allItems, debouncedQuery, yearFrom, yearTo]);

  const descriptorCounts = useMemo(() => {
    const pool = debouncedQuery ? dateFilteredResults : allItems;
    const counts: Record<string, number> = {};
    for (const key of Object.keys(DESCRIPTOR_LABELS)) counts[key] = 0;
    pool.forEach((item) => {
      item.descriptores?.forEach((d) => {
        if (d in counts) counts[d]++;
      });
    });
    return counts;
  }, [dateFilteredResults, allItems, debouncedQuery]);

  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setPage(1);
  }, [debouncedQuery, yearFrom, yearTo, selectedDescriptores, selectedResultados, selectedTipos]);

  const descriptorFilteredResults = useMemo(() => {
    if (selectedDescriptores.length === 0) return dateFilteredResults;
    return dateFilteredResults.filter((item) =>
      selectedDescriptores.some((d) => item.descriptores?.includes(d)),
    );
  }, [dateFilteredResults, selectedDescriptores]);

  const resultadoFilteredResults = useMemo(() => {
    if (selectedResultados.length === 0) return descriptorFilteredResults;
    return descriptorFilteredResults.filter((item) =>
      item.metadatos?.resultado ? selectedResultados.includes(item.metadatos.resultado) : false,
    );
  }, [descriptorFilteredResults, selectedResultados]);

  const tipoFilteredResults = useMemo(() => {
    if (selectedTipos.length === 0) return resultadoFilteredResults;
    return resultadoFilteredResults.filter((item) =>
      item.metadatos?.tipo_procedimiento ? selectedTipos.includes(item.metadatos.tipo_procedimiento) : false,
    );
  }, [resultadoFilteredResults, selectedTipos]);

  useEffect(() => { search(debouncedQuery, 500); }, [debouncedQuery, search]);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    setSearchHistory((prev) => {
      const next = [debouncedQuery, ...prev.filter((q) => q !== debouncedQuery)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        historyRef.current && !historyRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowHistory(false);
        setActiveHistoryIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const historyVisible = showHistory && !query && searchHistory.length > 0;
      if (e.key === "ArrowDown") {
        if (!historyVisible) return;
        e.preventDefault();
        setActiveHistoryIndex((prev) => prev < searchHistory.length - 1 ? prev + 1 : 0);
      } else if (e.key === "ArrowUp") {
        if (!historyVisible) return;
        e.preventDefault();
        setActiveHistoryIndex((prev) => prev > 0 ? prev - 1 : searchHistory.length - 1);
      } else if (e.key === "Enter") {
        if (historyVisible && activeHistoryIndex >= 0) {
          e.preventDefault();
          setQuery(searchHistory[activeHistoryIndex]);
          setShowHistory(false);
          setActiveHistoryIndex(-1);
        }
      } else if (e.key === "Escape") {
        if (historyVisible) {
          setShowHistory(false);
          setActiveHistoryIndex(-1);
        } else if (query) {
          setQuery("");
        }
      }
    },
    [query, showHistory, searchHistory, activeHistoryIndex],
  );

  const openItem = useCallback((item: ResolutionItem) => {
    setSelectedItem(item);
    setOverlayOpen(true);
  }, []);

  // Abrir directamente una resolución vía hash (#abrir=572-2024), p.ej. desde el grafo de citas
  useEffect(() => {
    if (allItems.length === 0) return;
    const abrir = parseHashParams().get("abrir");
    if (!abrir) return;
    const item = allItems.find((i) => i.metadatos?.resolucion === abrir);
    if (item) {
      openItem(item);
      writeHashParams({ abrir: null }); // limpiar para que no se reabra al cerrar
    }
  }, [allItems, openItem]);

  return (
    <>
      {/* Sección principal */}
      <div className="hero-vignette">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.85] mix-blend-soft-light dark:opacity-[0.85] dark:mix-blend-overlay"
          style={{ backgroundImage: "url('/hilo.png')" }}
        />
        <div className="relative z-[1] max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Image
                src="/privatasearch_logo.png"
                alt="PrivataSearch"
                width={56}
                height={56}
                priority
                className="h-12 sm:h-14 w-auto"
              />
              <div>
                <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Privata<span className="text-blue-600 dark:text-blue-400">Search</span>
                </div>
                <div className="font-mono text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  PRODHAB · Costa Rica
                </div>
              </div>
            </div>
            <DarkModeToggle />
          </div>

          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">
            Jurisprudencia de{" "}
            <span className="text-blue-600 dark:text-blue-400 font-light">Protección de Datos</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
            Resoluciones de la Agencia de Protección de Datos (PRODHAB) de Costa Rica.
          </p>

          {/* Barra de búsqueda */}
          <div className="relative w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-[18px] w-[18px] ${query ? "text-blue-500 dark:text-blue-400" : "text-neutral-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { setShowHistory(true); setActiveHistoryIndex(-1); }}
              placeholder="Buscar por tema, palabra clave o número…"
              role="combobox"
              aria-expanded={showHistory && !query && searchHistory.length > 0}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls="search-history-listbox"
              aria-activedescendant={
                showHistory && !query && activeHistoryIndex >= 0 ? `history-option-${activeHistoryIndex}` : undefined
              }
              aria-label="Buscar resoluciones"
              autoComplete="off"
              className="w-full pl-12 pr-12 py-3 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl bg-white dark:bg-neutral-800 text-base text-neutral-900 dark:text-neutral-100 transition-all focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-8 sm:h-8 grid place-items-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                title="Limpiar (Esc)"
                aria-label="Limpiar búsqueda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-neutral-400 border border-neutral-200/80 dark:border-neutral-700/80 rounded-md px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-700">
                /
              </span>
            )}

            {/* Desplegable de historial */}
            {showHistory && !query && searchHistory.length > 0 && (
              <div
                ref={historyRef}
                id="search-history-listbox"
                role="listbox"
                aria-label="Búsquedas recientes"
                className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden border border-neutral-200/80 bg-white rounded-xl dark:border-neutral-700/80 dark:bg-neutral-900 animate-slide-down"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Búsquedas recientes</span>
                  <button
                    onClick={() => {
                      setSearchHistory([]);
                      try { localStorage.removeItem(HISTORY_KEY); } catch {}
                      setShowHistory(false);
                    }}
                    className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors px-2 py-1.5 -mr-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label="Borrar historial de búsquedas"
                  >
                    Borrar
                  </button>
                </div>
                {searchHistory.map((h, idx) => (
                  <button
                    key={h}
                    id={`history-option-${idx}`}
                    role="option"
                    aria-selected={idx === activeHistoryIndex}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setQuery(h);
                      setShowHistory(false);
                      setActiveHistoryIndex(-1);
                    }}
                    onMouseEnter={() => setActiveHistoryIndex(idx)}
                    onMouseLeave={() => setActiveHistoryIndex(-1)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 transition-colors text-left ${
                      idx === activeHistoryIndex ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{h}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-auto max-w-[1320px] px-4 sm:px-6 mt-4 border border-red-200/80 bg-red-50 rounded-xl p-4 text-red-700 dark:border-red-800/80 dark:bg-red-900/30 dark:text-red-300 animate-slide-down"
        >
          <p className="font-medium">No se pudo cargar el índice de resoluciones</p>
          <p className="text-sm mt-0.5">{error}. Recarga la página para intentarlo de nuevo.</p>
        </div>
      )}

      {/* Diseño lateral: barra + resultados */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6">
        {/* Resumen de filtros activos */}
        {isSearching && (
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center flex-wrap gap-1.5 mb-4"
          >
            <strong className="text-neutral-900 dark:text-neutral-100">{tipoFilteredResults.length}</strong>
            {" "}resolucion{tipoFilteredResults.length === 1 ? "" : "es"} {query ? <>para «{query}»</> : "con los filtros:"}
            {(yearFrom || yearTo) && (
              <span className="bg-blue-100/70 rounded-md px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                {yearFrom ?? "…"}–{yearTo ?? "…"}
              </span>
            )}
            {selectedDescriptores.map((d) => (
              <span key={d} className="bg-indigo-100/70 rounded-md px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">
                {DESCRIPTOR_LABELS[d] ?? d}
              </span>
            ))}
            {selectedResultados.map((r) => (
              <span key={r} className="bg-neutral-200/70 rounded-md px-1.5 py-0.5 text-neutral-700 dark:bg-neutral-700/70 dark:text-neutral-200 font-medium">
                {RESULTADO_LABELS[r] ?? r}
              </span>
            ))}
            {selectedTipos.map((t) => (
              <span key={t} className="bg-neutral-200/70 rounded-md px-1.5 py-0.5 text-neutral-700 dark:bg-neutral-700/70 dark:text-neutral-200 font-medium">
                {TIPO_LABELS[t] ?? t}
              </span>
            ))}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Barra lateral */}
          <aside className="lg:sticky lg:top-6">
            <SearchConfigPanel
              limit={limit}
              setLimit={setLimit}
              similarityThreshold={similarityThreshold}
              setSimilarityThreshold={setSimilarityThreshold}
              relatedLimit={relatedLimit}
              setRelatedLimit={setRelatedLimit}
              yearFrom={yearFrom}
              setYearFrom={setYearFrom}
              yearTo={yearTo}
              setYearTo={setYearTo}
              availableYears={availableYears}
              selectedDescriptores={selectedDescriptores}
              setSelectedDescriptores={setSelectedDescriptores}
              descriptorCounts={descriptorCounts}
              highlightEnabled={highlightEnabled}
              setHighlightEnabled={setHighlightEnabled}
              selectedResultados={selectedResultados}
              setSelectedResultados={setSelectedResultados}
              selectedTipos={selectedTipos}
              setSelectedTipos={setSelectedTipos}
              isSearching={isSearching}
            />
          </aside>

          {/* Resultados */}
          <section aria-label="Resultados de búsqueda">
            <SearchResults
              query={debouncedQuery}
              limit={limit}
              filteredItems={isSearching ? tipoFilteredResults : allItems}
              isSearching={isSearching}
              highlightEnabled={highlightEnabled}
              selectedDescriptores={selectedDescriptores}
              page={page}
              setPage={setPage}
              totalItems={allItems.length}
              onOpenItem={openItem}
              onExampleQuery={setQuery}
              onClearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
            />
          </section>
        </div>
      </div>

      {/* Panel de lectura */}
      {overlayOpen && selectedItem && (
        <ReaderOverlay
          item={selectedItem}
          query={debouncedQuery}
          allItems={isSearching ? tipoFilteredResults : allItems}
          similarityThreshold={similarityThreshold}
          relatedLimit={relatedLimit}
          highlightEnabled={highlightEnabled}
          selectedDescriptores={selectedDescriptores}
          onClose={closeOverlay}
          onOpenItem={openItem}
          onSelectDescriptor={(d) => {
            setSelectedDescriptores((prev) => (prev.includes(d) ? prev : [...prev, d]));
            closeOverlay();
          }}
          closing={overlayClosing}
        />
      )}
    </>
  );
}
