"use client";
import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X, ClipboardCopy, Check, User, Share2, ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";
import { ResolutionItem, TIPO_LABELS, DESCRIPTOR_LABELS, useSearchIndex } from "@/context/SearchContext";
import { ResultadoBadge } from "./SearchResults";
import { findMostSimilar } from "@/utils/semanticSimilarity";
import { highlightText, buildQueryPatterns } from "@/utils/highlightText";
import { formatCitaCR, fmtFecha, parseResolutionText, splitIntoParagraphs, tieneDato } from "@/utils/formatters";

const BAR_BUTTON =
  "inline-flex items-center justify-center gap-1.5 border border-neutral-200/80 bg-white rounded-lg px-3 min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 text-xs font-medium text-neutral-600 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors";
const COPIED = "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400";

/** Encabezado de sección: rótulo + filete que ocupa el resto de la línea. */
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3.5 whitespace-nowrap">
      <span className={SECTION_LABEL}>{children}</span>
      <span className="flex-1 h-px bg-neutral-200/80 dark:bg-neutral-800/80" />
    </div>
  );
}

interface ReaderOverlayProps {
  item: ResolutionItem;
  query: string;
  allItems: ResolutionItem[];
  similarityThreshold: number;
  relatedLimit: number;
  highlightEnabled: boolean;
  selectedDescriptores: string[];
  onClose: () => void;
  onOpenItem: (item: ResolutionItem) => void;
  onSelectDescriptor?: (descriptor: string) => void;
}

export function ReaderOverlay({
  item,
  query,
  allItems,
  similarityThreshold,
  relatedLimit,
  highlightEnabled,
  onClose,
  onOpenItem,
  onSelectDescriptor,
  closing = false,
}: ReaderOverlayProps & { closing?: boolean }) {
  const [citaCopied, setCitaCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  // Corpus completo (no la lista filtrada de allItems) para resolver citas a otras resoluciones
  const { allItems: corpus } = useSearchIndex();

  // Mover el foco al panel al abrir y devolverlo al elemento que lo abrió al cerrar
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [item.id]);

  // Mapa n.° de resolución → item, con ceros a la izquierda normalizados
  // (las citas a veces vienen como "48-2018" y el índice tiene "048-2018")
  const byResolucion = React.useMemo(() => {
    const m = new Map<string, ResolutionItem>();
    for (const it of corpus) {
      const n = it.metadatos?.resolucion;
      if (n) m.set(n.replace(/^0+/, ""), it);
    }
    return m;
  }, [corpus]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    const main = document.getElementById("main-content");
    if (main) main.setAttribute("inert", "");
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
      if (main) main.removeAttribute("inert");
    };
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [item.id]);

  const copiarCita = useCallback(() => {
    navigator.clipboard.writeText(formatCitaCR(item)).then(() => {
      setCitaCopied(true);
      setTimeout(() => setCitaCopied(false), 2000);
    }).catch(() => {});
  }, [item]);

  // Enlace permanente: la página principal abre la resolución vía #abrir=<n.° de resolución>
  const copiarEnlace = useCallback(() => {
    const res = item.metadatos?.resolucion;
    if (!res) return;
    navigator.clipboard.writeText(`${window.location.origin}/#abrir=${res}`).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {});
  }, [item]);

  const queryPatterns = React.useMemo(
    () => (highlightEnabled ? buildQueryPatterns(query) : []),
    [query, highlightEnabled],
  );

  const highlight = useCallback(
    (text: string) => highlightEnabled ? highlightText(text, queryPatterns, []) : text,
    [highlightEnabled, queryPatterns],
  );

  const related = React.useMemo(() => {
    if (!item.vector) return [];
    return findMostSimilar(
      item.vector,
      allItems.filter((i) => i.id !== item.id),
      relatedLimit,
      0.5, // diversityFactor fijo; el slider de precisión solo controla el umbral
      similarityThreshold,
    );
  }, [item, allItems, relatedLimit, similarityThreshold]);

  const parsedSections = React.useMemo(() => parseResolutionText(item.texto, item.secciones), [item.texto, item.secciones]);

  const resultado = item.metadatos?.resultado;

  const citaIcon = (
    <span className="relative w-3.5 h-3.5">
      <ClipboardCopy className={`w-3.5 h-3.5 absolute inset-0 transition-all duration-150 ${citaCopied ? "opacity-0 scale-75" : "opacity-100 scale-100"}`} />
      <Check className={`w-3.5 h-3.5 absolute inset-0 transition-all duration-150 ${citaCopied ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
    </span>
  );
  const enlaceIcon = (
    <span className="relative w-3.5 h-3.5">
      <Link2 className={`w-3.5 h-3.5 absolute inset-0 transition-all duration-150 ${linkCopied ? "opacity-0 scale-75" : "opacity-100 scale-100"}`} />
      <Check className={`w-3.5 h-3.5 absolute inset-0 transition-all duration-150 ${linkCopied ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
    </span>
  );

  // Un solo juego de acciones: en la barra superior en escritorio, dentro del texto en móvil
  const acciones = (
    <>
      <button
        onClick={copiarCita}
        title={citaCopied ? "¡Copiado!" : "Copiar cita"}
        className={`${BAR_BUTTON} ${citaCopied ? COPIED : ""}`}
      >
        {citaIcon}
        {citaCopied ? "Copiado" : "Citar"}
      </button>
      {item.metadatos?.resolucion && (
        <button
          onClick={copiarEnlace}
          title={linkCopied ? "¡Enlace copiado!" : "Copiar enlace a esta resolución"}
          className={`${BAR_BUTTON} ${linkCopied ? COPIED : ""}`}
        >
          {enlaceIcon}
          {linkCopied ? "Copiado" : "Enlace"}
        </button>
      )}
      {item.metadatos?.resolucion && (
        <Link
          href={`/grafo/#res=${item.metadatos.resolucion}`}
          className={BAR_BUTTON}
          title="Ver esta resolución en la red de citas"
        >
          <Share2 className="w-3.5 h-3.5" />
          Red
        </Link>
      )}
      {item.metadatos?.archivo_origen && (
        <a
          href={item.metadatos.archivo_origen}
          target="_blank"
          rel="noopener noreferrer"
          className={BAR_BUTTON}
          title="Ver PDF (se abre en otra pestaña)"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          PDF
        </a>
      )}
    </>
  );

  const metadatos: [string, string, boolean][] = [
    ["N.° de resolución", item.metadatos?.resolucion ?? "—", true],
    ["Expediente", item.metadatos?.expediente ?? "—", true],
    ["Fecha", tieneDato(item.metadatos?.fecha) ? fmtFecha(item.metadatos.fecha) : "—", false],
    ["Denunciado(a)", item.metadatos?.denunciado ?? "—", false],
  ];

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-end ${closing ? "animate-overlay-out" : "animate-overlay"}`}
      style={{ background: "rgba(23, 23, 40, 0.4)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-title"
        className={`w-full sm:w-[min(760px,94vw)] h-full overflow-y-auto bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 ${closing ? "animate-slide-out-right" : "animate-slide-in-right"}`}
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Barra superior */}
        <div className="sticky top-0 z-10 flex items-center gap-2 px-3 sm:px-5 h-16 sm:h-auto sm:py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-11 h-11 sm:w-9 sm:h-9 grid place-items-center border border-neutral-200/80 dark:border-neutral-700/80 rounded-lg bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 hover:border-blue-400 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="flex-1 font-mono text-xs text-neutral-500 dark:text-neutral-500 truncate">
            {item.metadatos?.resolucion ?? item.metadatos?.expediente ?? ""}
          </span>
          {/* Escritorio: las acciones caben en la barra; en móvil van dentro del texto */}
          <div className="hidden sm:flex items-center gap-2">{acciones}</div>
        </div>

        {/* Contenido */}
        <div className="max-w-[760px] mx-auto px-5 sm:px-10 py-7 sm:py-9 pb-16 sm:pb-20">
          {/* Insignias */}
          <div className="flex flex-wrap items-center gap-2.5">
            {resultado && <ResultadoBadge resultado={resultado} />}
            {item.metadatos?.tipo_procedimiento && (
              <span className={SECTION_LABEL}>
                {TIPO_LABELS[item.metadatos.tipo_procedimiento] ?? item.metadatos.tipo_procedimiento}
              </span>
            )}
          </div>

          {/* Título */}
          <h1 id="reader-title" className="text-2xl sm:text-3xl font-medium tracking-tight mt-4 leading-tight text-neutral-900 dark:text-neutral-100">
            {highlight(item.titulo)}
          </h1>

          {/* Metadatos: dos columnas, filetes en lugar de cajas */}
          <dl className="grid grid-cols-2 gap-x-8 mt-6 border-t border-neutral-200/80 dark:border-neutral-800/80">
            {metadatos.map(([k, v, mono]) => (
              <div key={k} className="min-w-0 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80">
                <dt className={`${SECTION_LABEL} mb-1`}>{k}</dt>
                <dd className={`m-0 text-neutral-900 dark:text-neutral-100 break-words ${mono ? "font-mono text-sm" : "text-[15px]"}`}>{v}</dd>
              </div>
            ))}
          </dl>

          {/* Firmante */}
          {tieneDato(item.metadatos?.firmante) && (
            <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500 mt-3.5">
              <User className="w-3.5 h-3.5" />
              {item.metadatos.firmante}
            </p>
          )}

          {/* Móvil: las acciones acompañan a la ficha, sin una segunda barra fija */}
          <div className="flex sm:hidden flex-wrap justify-center gap-2 mt-5">{acciones}</div>

          {/* Secciones legales procesadas */}
          <div className="mt-9">
            {parsedSections.map((sec, i) => (
              <div key={i} className="mb-8">
                <SectionHead>{sec.label}</SectionHead>
                {sec.label === "Encabezado" ? (
                  <p className="text-base leading-relaxed text-blue-950 dark:text-blue-100 bg-blue-50/60 dark:bg-blue-950/20 rounded-lg px-4 py-3.5 max-w-[65ch]">
                    {highlight(sec.text)}
                  </p>
                ) : (
                  <div className="text-base leading-relaxed text-neutral-800 dark:text-neutral-200 max-w-[65ch]">
                    {splitIntoParagraphs(sec.text).map((p, j) => (
                      <p key={j} className="mb-3.5">{highlight(p)}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sección: Temas */}
          {item.descriptores && item.descriptores.length > 0 && (
            <div className="mb-8">
              <SectionHead>Temas jurídicos</SectionHead>
              <div className="flex flex-wrap gap-2">
                {item.descriptores.map((d) => (
                  <button
                    key={d}
                    onClick={() => onSelectDescriptor?.(d)}
                    title={`Filtrar resoluciones por «${DESCRIPTOR_LABELS[d] ?? d}»`}
                    className="inline-flex items-center min-h-9 px-3 text-xs font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700/80 rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {DESCRIPTOR_LABELS[d] ?? d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Resoluciones citadas */}
          {item.metadatos?.resoluciones_citadas && item.metadatos.resoluciones_citadas.length > 0 && (
            <div className="mb-8">
              <SectionHead>Resoluciones citadas</SectionHead>
              <div className="flex flex-wrap gap-2">
                {item.metadatos.resoluciones_citadas.map((r) => {
                  const cited = byResolucion.get(r.replace(/^0+/, ""));
                  return cited && cited.id !== item.id ? (
                    <button
                      key={r}
                      onClick={() => onOpenItem(cited)}
                      title={`Abrir resolución ${cited.metadatos?.resolucion ?? r}`}
                      className="inline-flex items-center min-h-9 px-3 font-mono text-xs bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      {r}
                    </button>
                  ) : (
                    <span
                      key={r}
                      title="No disponible en el índice (p. ej. jurisprudencia de la Sala Constitucional)"
                      className="inline-flex items-center min-h-9 px-3 font-mono text-xs border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-500 dark:text-neutral-400"
                    >
                      {r}
                    </span>
                  );
                })}
              </div>
              <p className="mt-2.5 text-xs text-neutral-500 dark:text-neutral-500">
                Las citas con borde punteado no están disponibles en el índice.
              </p>
            </div>
          )}

          {/* Sección: Relacionadas */}
          {related.length > 0 && (
            <div className="mb-8">
              <SectionHead>Resoluciones relacionadas</SectionHead>
              <div className="space-y-2.5">
                {related.map((r) => (
                  <button
                    key={r.item.id}
                    type="button"
                    aria-label={`Abrir resolución: ${r.item.titulo}`}
                    onClick={() => onOpenItem(r.item)}
                    className="w-full text-left p-4 border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl bg-white dark:bg-neutral-900 hover:border-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs text-neutral-500 dark:text-neutral-500">
                        {r.item.metadatos?.resolucion ?? r.item.metadatos?.expediente ?? ""}
                      </span>
                      {r.item.metadatos?.resultado && <ResultadoBadge resultado={r.item.metadatos.resultado} />}
                      <span className="flex-1" />
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                        <span className="w-12 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden" aria-hidden="true">
                          <span className="block h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${Math.round(r.similarity * 100)}%` }} />
                        </span>
                        {Math.round(r.similarity * 100)}% similitud
                      </span>
                    </div>
                    <div className="text-[15px] font-medium leading-snug mt-2 text-neutral-900 dark:text-neutral-100">
                      {r.item.titulo}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
