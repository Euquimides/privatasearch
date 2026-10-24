export function PrivacyNotice() {
  return (
    <p data-tour="form-privacidad" className="mb-6 flex items-start gap-2 rounded-xl border border-blue-200/80 dark:border-blue-900/80 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-sm text-blue-900 dark:text-blue-200">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="mt-0.5 h-4 w-4 shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 2.5 3.5 5v4.5c0 4 2.8 6.9 6.5 8 3.7-1.1 6.5-4 6.5-8V5L10 2.5Z"
        />
      </svg>
      <span>
        Sus datos se procesan únicamente en su navegador. PrivataSearch no los envía ni almacena en
        ningún servidor. Este asistente ayuda a completar el formulario oficial; no sustituye ni
        garantiza su aceptación por PRODHAB.
      </span>
    </p>
  );
}
