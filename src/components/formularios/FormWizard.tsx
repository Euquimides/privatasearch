"use client";

import { useEffect, useRef, useState } from "react";
import type { FormSchema, FormValues } from "@/schemas/form-schema.types";
import { validateSection } from "@/utils/validateForm";
import { coerceImportedValues } from "@/utils/coerceImportedValues";
import { downloadDocx } from "@/utils/exportToDocx";
import { downloadMarkdown } from "@/utils/exportToMarkdown";
import { downloadPdf } from "@/utils/exportToPdf";
import { downloadBlob } from "@/utils/downloadBlob";
import { FormRenderer } from "./FormRenderer";

export function FormWizard({ schema }: { schema: FormSchema }) {
  const [values, setValues] = useState<FormValues>({});
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [keepProgress, setKeepProgress] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [sectionErrorSummary, setSectionErrorSummary] = useState<string | null>(null);
  const [errorAttempt, setErrorAttempt] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const storageKey = `formularios:${schema.id}`;

  // ponytail: sin localStorage por defecto (PRD 6.4). sessionStorage solo
  // si el usuario activa "mantener mi progreso"; se limpia con "Borrar
  // todo" y desaparece sola al cerrar la pestaña.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(`${storageKey}:keep`) === "1") {
        setKeepProgress(true);
        const saved = sessionStorage.getItem(`${storageKey}:values`);
        if (saved) setValues(JSON.parse(saved));
      }
    } catch {
      // sessionStorage inaccesible (modo privado, etc.): seguir sin progreso guardado
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!keepProgress) return;
    try {
      sessionStorage.setItem(`${storageKey}:values`, JSON.stringify(values));
    } catch {
      // ignorar: guardado de progreso es una conveniencia, no un requisito
    }
  }, [keepProgress, values, storageKey]);

  // Mueve el foco al encabezado de la sección al cambiar de paso, para que
  // los usuarios de lector de pantalla noten el cambio de contenido.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // Tras un "Siguiente" con errores: foco y scroll al primer campo inválido
  // (o al resumen, si el error es de un grupo sin input, p. ej. minItems).
  useEffect(() => {
    if (errorAttempt === 0) return;
    const target =
      fieldsRef.current?.querySelector<HTMLElement>('input[aria-invalid="true"], textarea[aria-invalid="true"]') ??
      summaryRef.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "center" });
  }, [errorAttempt]);

  const hasData = Object.keys(values).length > 0;

  // ponytail: sessionStorage no sobrevive al cierre de pestaña y el .json es
  // manual, así que con datos escritos se avisa antes de salir. No cubre la
  // navegación interna con <Link>; agregar si el wizard enlaza hacia afuera.
  useEffect(() => {
    if (!hasData) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasData]);

  const section = schema.sections[step];
  const isLast = step === schema.sections.length - 1;
  const incompleteSections = isLast
    ? schema.sections
        .map((s, index) => ({ s, index }))
        .filter(({ s }) => Object.keys(validateSection(s, values)).length > 0)
    : [];
  const isFormValid = incompleteSections.length === 0; // solo se consulta en el último paso

  function goTo(index: number) {
    if (!visited.has(index) && index > step + 1) return; // solo secciones ya visitadas o la siguiente
    setStep(index);
    setVisited((prev) => new Set(prev).add(index));
    setErrors({});
    setSectionErrorSummary(null);
  }

  function handleChange(fieldId: string, value: FormValues[string]) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (!(fieldId in prev)) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  function handleNext() {
    const sectionErrors = validateSection(section, values);
    setErrors(sectionErrors);
    const errorCount = Object.keys(sectionErrors).length;
    if (errorCount > 0) {
      setSectionErrorSummary(
        errorCount === 1 ? "Hay 1 campo con error en esta sección." : `Hay ${errorCount} campos con error en esta sección.`
      );
      setErrorAttempt((n) => n + 1);
      return;
    }
    setSectionErrorSummary(null);
    if (!isLast) goTo(step + 1);
  }

  function handleReset() {
    // Un click borraría todas las secciones sin vuelta atrás: se confirma.
    if (
      hasData &&
      !confirm(
        `¿Borrar las respuestas de las ${schema.sections.length} secciones de este formulario? Esta acción no se puede deshacer.`
      )
    )
      return;
    setValues({});
    setErrors({});
    setSectionErrorSummary(null);
    setStep(0);
    setVisited(new Set([0]));
    try {
      sessionStorage.removeItem(`${storageKey}:values`);
    } catch {
      // ignorar
    }
  }

  function handleToggleKeepProgress(checked: boolean) {
    setKeepProgress(checked);
    try {
      if (checked) {
        sessionStorage.setItem(`${storageKey}:keep`, "1");
        sessionStorage.setItem(`${storageKey}:values`, JSON.stringify(values));
      } else {
        sessionStorage.removeItem(`${storageKey}:keep`);
        sessionStorage.removeItem(`${storageKey}:values`);
      }
    } catch {
      // ignorar
    }
  }

  async function handleExportDocx() {
    setExportingDocx(true);
    setExportError(null);
    try {
      await downloadDocx(schema, values);
    } catch {
      setExportError("No se pudo generar el documento Word. Intente de nuevo.");
    } finally {
      setExportingDocx(false);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    setExportError(null);
    try {
      await downloadPdf(schema, values);
    } catch {
      setExportError("No se pudo generar el PDF. Intente de nuevo.");
    } finally {
      setExportingPdf(false);
    }
  }

  function handleExportJson() {
    const payload = { schemaId: schema.id, officialVersion: schema.officialVersion, values };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${schema.id}-progreso.json`);
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.schemaId !== schema.id) {
        setImportError(`Este archivo pertenece a otro formulario (${parsed.schemaId ?? "desconocido"}).`);
        return;
      }
      if (typeof parsed.values !== "object" || parsed.values === null) {
        setImportError("Archivo de progreso inválido.");
        return;
      }
      setValues(coerceImportedValues(schema, parsed.values));
      setErrors({});
      setImportError(null);
    } catch {
      setImportError("No se pudo leer el archivo de progreso.");
    }
  }

  return (
    <div className="lg:grid lg:grid-cols-[224px_1fr] lg:gap-10 lg:items-start">
      <nav
        aria-label={`Progreso del formulario, sección ${step + 1} de ${schema.sections.length}`}
        className="mb-6 lg:sticky lg:top-16 lg:mb-0"
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            {step + 1} / {schema.sections.length}
          </span>
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
              style={{ width: `${((step + 1) / schema.sections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* ponytail: una sola lista; en móvil es una fila de chips, en lg+ una
            columna con el título de cada sección. */}
        <ol className="flex flex-wrap gap-2 lg:max-h-[calc(100vh-10rem)] lg:flex-col lg:flex-nowrap lg:gap-0.5 lg:overflow-y-auto">
          {schema.sections.map((s, index) => {
            const isCurrent = index === step;
            const isVisited = visited.has(index);
            const isDone = index < step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!isVisited}
                  aria-current={isCurrent ? "step" : undefined}
                  title={`${s.number} ${s.title}`}
                  onClick={() => goTo(index)}
                  className={`flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs transition-all lg:h-auto lg:w-full lg:justify-start lg:rounded-lg lg:px-2.5 lg:py-2 lg:text-left ${
                    isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-600/15 lg:ring-0 lg:bg-blue-50 lg:text-blue-700 dark:lg:bg-blue-950/50 dark:lg:text-blue-300 lg:font-medium"
                      : isDone
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950 lg:bg-transparent dark:lg:bg-transparent lg:text-neutral-700 dark:lg:text-neutral-300 lg:hover:bg-neutral-100 dark:lg:hover:bg-neutral-900"
                      : isVisited
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 lg:bg-transparent dark:lg:bg-transparent lg:hover:bg-neutral-100 dark:lg:hover:bg-neutral-900"
                      : "bg-neutral-50 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 cursor-not-allowed lg:bg-transparent dark:lg:bg-transparent"
                  }`}
                >
                  {isDone && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      className="h-3 w-3 lg:hidden"
                    >
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span className="font-mono uppercase tracking-widest lg:hidden">{s.number}</span>

                  <span
                    aria-hidden="true"
                    className={`hidden shrink-0 items-center justify-center font-mono lg:flex lg:h-5 lg:w-5 lg:rounded-full lg:text-[10px] ${
                      isCurrent
                        ? "lg:bg-blue-600 lg:text-white"
                        : isDone
                        ? "lg:bg-blue-100 lg:text-blue-700 dark:lg:bg-blue-950 dark:lg:text-blue-300"
                        : "lg:bg-neutral-100 lg:text-neutral-500 dark:lg:bg-neutral-800 dark:lg:text-neutral-500"
                    }`}
                  >
                    {isDone ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        className="h-2.5 w-2.5"
                      >
                        <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      s.number.replace(".", "")
                    )}
                  </span>
                  <span className="hidden leading-snug lg:block">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-4 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 focus:outline-none"
      >
        {section.number} {section.title}
      </h2>

      {/* La región viva existe desde el primer render: si se montara ya con
          texto, los lectores de pantalla no la anunciarían. */}
      <div ref={summaryRef} tabIndex={-1} role="status" className="focus:outline-none">
        {sectionErrorSummary && (
          <p className="mb-4 rounded-xl border border-red-200/80 dark:border-red-800/80 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300">
            {sectionErrorSummary}
          </p>
        )}
      </div>

      <div ref={fieldsRef}>
        <FormRenderer section={section} values={values} errors={errors} onChange={handleChange} />
      </div>

      {importError && <p className="mt-4 text-xs text-red-600 dark:text-red-400">{importError}</p>}
      {exportError && (
        <p role="alert" className="mt-4 text-xs text-red-600 dark:text-red-400">
          {exportError}
        </p>
      )}

      {/* ponytail: reserva espacio en lg+ (donde la barra sí es sticky) para
          que no atrape el último campo de secciones largas sin más scroll
          posible. */}
      <div className="hidden lg:block lg:h-32" aria-hidden="true" />

      {/* ponytail: sticky solo desde lg. En pantallas cortas por debajo de
          eso, "sticky bottom-0" se pega al fondo del viewport desde el
          primer render (aunque no se haya hecho scroll), tapando campos
          reales como si fueran clicables cuando en verdad reciben el click
          la barra de abajo. Ver bug: checkbox "mantener progreso" se
          desmarcaba solo al hacer click en un radio que quedaba oculto
          detrás de la barra. */}
      <div className="lg:sticky lg:bottom-0 z-30 mt-8 -mx-6 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-950/95 px-6 pt-3 pb-3.5 backdrop-blur-md shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <label className="flex min-h-6 cursor-pointer items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-blue-600"
              checked={keepProgress}
              onChange={(e) => handleToggleKeepProgress(e.target.checked)}
            />
            Mantener mi progreso mientras navego
          </label>
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-neutral-400 dark:text-neutral-600 sm:inline">
              Descargue un .json para continuar después, sin depender de este navegador
            </span>
            <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleExportJson}
              title="Descargar un archivo .json con sus respuestas, para continuar más tarde o en otro equipo"
              aria-label="Guardar progreso"
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-blue-600 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-blue-400"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" strokeLinejoin="round" />
                <path d="M17 21v-8H7v8M7 3v5h8" strokeLinejoin="round" />
              </svg>
              Guardar
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Cargar un archivo .json guardado antes para retomar sus respuestas"
              aria-label="Cargar progreso"
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-blue-600 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-blue-400"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M12 15V3m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cargar
            </button>
            <div className="mx-1 h-[18px] w-px bg-neutral-200 dark:bg-neutral-800" />
            <button
              type="button"
              onClick={handleReset}
              title="Borrar todo"
              aria-label="Borrar todo"
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Borrar todo
            </button>
            </div>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} hidden />

        {isLast && !isFormValid && (
          <div id="export-blocked" className="mb-3 text-xs text-neutral-600 dark:text-neutral-400">
            Para exportar, complete los campos obligatorios de:{" "}
            {incompleteSections.map(({ s, index }, i) => (
              <span key={s.id}>
                {i > 0 && ", "}
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  {s.number} {s.title}
                </button>
              </span>
            ))}
            .
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="hidden font-mono text-[11px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600 sm:inline">
            Sección {step + 1} de {schema.sections.length}
          </span>
          <div className="flex w-full flex-wrap justify-end gap-2.5 sm:w-auto">
          {step > 0 && (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 px-5 py-3 text-sm text-neutral-700 dark:text-neutral-300 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-95"
            >
              Anterior
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-95 sm:flex-none"
            >
              Siguiente
            </button>
          )}
          {isLast && (
            <>
              <button
                type="button"
                onClick={() => downloadMarkdown(schema, values)}
                disabled={!isFormValid}
                aria-describedby={!isFormValid ? "export-blocked" : undefined}
                className="flex-1 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 disabled:text-neutral-400 dark:disabled:text-neutral-600 sm:flex-none"
              >
                Exportar a Markdown
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!isFormValid || exportingPdf}
                aria-describedby={!isFormValid ? "export-blocked" : undefined}
                className="flex-1 rounded-xl border border-blue-600 px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/40 active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 disabled:border-neutral-200/80 disabled:text-neutral-400 dark:disabled:border-neutral-700/80 dark:disabled:text-neutral-600 sm:flex-none"
              >
                {exportingPdf ? "Generando…" : "Exportar a PDF"}
              </button>
              <button
                type="button"
                onClick={handleExportDocx}
                disabled={!isFormValid || exportingDocx}
                aria-describedby={!isFormValid ? "export-blocked" : undefined}
                className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 sm:flex-none"
              >
                {exportingDocx ? "Generando…" : "Exportar a Word"}
              </button>
            </>
          )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
