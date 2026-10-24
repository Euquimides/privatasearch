"use client";
import { useEffect, useState } from "react";
import { Joyride, STATUS, type Step, type TooltipRenderProps } from "react-joyride";
import { CircleHelp, X } from "lucide-react";

/** Evento que lanza el botón "?" de la cabecera; cada pantalla monta su <Tour>. */
export const TOUR_EVENT = "ps-tour";

const LOCALE = {
  back: "Atrás",
  close: "Cerrar",
  last: "Listo",
  next: "Siguiente",
  open: "Abrir",
  skip: "Saltar",
};

/** Primer elemento visible con ese data-tour (algunos se duplican entre móvil y escritorio). */
export function visible(name: string) {
  return () =>
    Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)).find(
      (el) => el.getClientRects().length > 0
    ) ?? null;
}

function resolve(target: Step["target"]) {
  return typeof target === "string" ? document.querySelector<HTMLElement>(target)
    : typeof target === "function" ? target()
    : target instanceof HTMLElement ? target
    : target.current;
}

/** El destino del paso existe y se ve (p. ej. la leyenda del grafo está oculta en móvil). */
function isShown({ target }: Step) {
  if (target === "body") return true;
  const el = resolve(target);
  return !!el && el.getClientRects().length > 0;
}

/** Un destino más alto que la pantalla no deja sitio al tooltip (queda cortado);
    se destaca su primer hijo, p. ej. el encabezado de una lista o la primera tarjeta. */
function fit(step: Step): Step {
  if (step.target === "body") return step;
  const el = resolve(step.target);
  const first = el?.firstElementChild;
  return el && first instanceof HTMLElement && el.offsetHeight > window.innerHeight * 0.6
    ? { ...step, target: first }
    : step;
}

// ponytail: el tour solo arranca a petición (botón "?"), así que no se guarda
// nada en localStorage.
export function Tour({ steps, event = TOUR_EVENT }: { steps: Step[]; event?: string }) {
  // Cada arranque remonta Joyride (key) para empezar siempre desde el paso 1
  const [run, setRun] = useState(0);
  const [active, setActive] = useState<Step[]>([]);

  useEffect(() => {
    const start = () => {
      // Filtrar al arrancar: Joyride termina el tour si no encuentra un destino
      setActive(steps.filter(isShown).map(fit));
      setRun((n) => Math.abs(n) + 1);
    };
    window.addEventListener(event, start);
    return () => window.removeEventListener(event, start);
  }, [event, steps]);

  // Esc termina el tour (Joyride solo avanza de paso) y no llega a otros
  // manejadores, p. ej. el del lector, que se cerraría por debajo.
  useEffect(() => {
    if (run <= 0 || active.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setRun((n) => -n);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [run, active]);

  if (run <= 0 || active.length === 0) return null;
  return (
    <Joyride
      key={run}
      run
      continuous
      steps={active}
      locale={LOCALE}
      tooltipComponent={TourTooltip}
      // Contorno del destacado: invisible en claro, anillo azul en oscuro (globals.css)
      styles={{ spotlight: { stroke: "transparent", strokeWidth: 2 } }}
      onEvent={(data) => {
        if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) setRun((n) => -n);
      }}
      options={{
        skipBeacon: true,
        closeButtonAction: "skip",
        overlayClickAction: false,
        dismissKeyAction: false,
        arrowColor: "var(--tour-bg)",
        spotlightRadius: 12,
        // Barra fija más alta (lector en móvil, 64px) + relleno del destacado (10px)
        scrollOffset: 80,
      }}
    />
  );
}

/** Tooltip con las clases del sitio (el de Joyride trae tipografía y colores propios). */
function TourTooltip({ step, index, size, isLastStep, backProps, closeProps, primaryProps, skipProps, tooltipProps }: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="react-joyride__tooltip w-[min(360px,calc(100vw-2rem))] rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:border-neutral-800/80 dark:bg-neutral-900"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {index + 1} / {size}
        </span>
        <button
          {...closeProps}
          className="-m-1.5 grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {step.title && (
        <h2 className="mb-1.5 font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">{step.title}</h2>
      )}
      <div className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{step.content}</div>
      <div className="mt-5 flex items-center justify-between gap-2">
        {isLastStep ? (
          <span />
        ) : (
          <button
            {...skipProps}
            className="text-xs text-neutral-500 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {LOCALE.skip}
          </button>
        )}
        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="rounded-xl border border-neutral-200/80 px-4 py-2 text-sm text-neutral-700 transition-all hover:bg-neutral-50 active:scale-95 dark:border-neutral-700/80 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {LOCALE.back}
            </button>
          )}
          <button
            {...primaryProps}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-95"
          >
            {isLastStep ? LOCALE.last : LOCALE.next}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Botón "?" que lanza el tour de la pantalla actual. */
export function TourButton({ event = TOUR_EVENT }: { event?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(event))}
      title="Ver tutorial"
      aria-label="Ver tutorial"
      className="rounded-full p-3 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
    >
      <CircleHelp aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
