import Link from "next/link";
import Footer from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { PrivacyNotice } from "@/components/formularios/PrivacyNotice";
import { organismosPublicosSchema } from "@/schemas/organismos-publicos.schema";
import { personasFisicasSchema } from "@/schemas/personas-fisicas.schema";
import { personasJuridicasSchema } from "@/schemas/personas-juridicas.schema";
import { Tour } from "@/components/Tour";

const TOUR_STEPS = [
  {
    target: '[data-tour="form-privacidad"]',
    title: "Sus datos no salen del navegador",
    content: "Los formularios se completan y exportan aquí mismo; PrivataSearch no envía ni guarda sus respuestas.",
  },
  {
    target: '[data-tour="form-tipos"]',
    title: "Elija su formulario",
    content: "Según quién inscribe la base de datos: persona física, persona jurídica u organismo público. Dentro del formulario, el botón ? explica cada herramienta.",
  },
];

const FORM_TYPES = [
  {
    href: "/formularios/personas-fisicas",
    sections: personasFisicasSchema.sections.length,
    title: "Persona física",
    description: "Para personas físicas que necesitan inscribir una base de datos a nombre propio.",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/formularios/personas-juridicas",
    sections: personasJuridicasSchema.sections.length,
    title: "Persona jurídica",
    description: "Para empresas u organizaciones privadas, con datos de representante legal.",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 13h18" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/formularios/organismos-publicos",
    sections: organismosPublicosSchema.sections.length,
    title: "Organismos públicos",
    description: "Para instituciones del sector público, con secciones específicas.",
    icon: (
      <>
        <path d="M4 21h16" strokeLinecap="round" />
        <path d="M5 21V10M9 21V10M15 21V10M19 21V10" strokeLinecap="round" />
        <path d="M3 10l9-6 9 6" strokeLinejoin="round" />
      </>
    ),
  },
];

export default function FormulariosPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <SiteHeader subtitle="Formularios" />

      <div className="hero-vignette">
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-12 pb-8 md:pt-14">
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
            Formularios de inscripción PRODHAB
          </h1>
          <p className="max-w-prose text-neutral-700 dark:text-neutral-300">
            Complete en su navegador una versión de PrivataSearch del formulario de inscripción del
            Registro de Bases de Datos de PRODHAB, para presentar luego por los canales oficiales.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-12 flex-1">
        <PrivacyNotice />

        <div data-tour="form-tipos" className="grid gap-4 sm:grid-cols-3">
          {FORM_TYPES.map((form, index) => (
            <Link
              key={form.href}
              href={form.href}
              className="group flex flex-col gap-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 transition-all hover:border-blue-500 hover:shadow-[0_4px_16px_rgba(37,99,235,0.10)] dark:hover:border-blue-500"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  >
                    {form.icon}
                  </svg>
                </span>
                <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div>
                <h2 className="mb-1.5 font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {form.title}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{form.description}</p>
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {form.sections} secciones · puede guardar un .json y retomarlo después
                </p>
              </div>
              <span className="mt-auto flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400">
                Comenzar
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
      <Tour steps={TOUR_STEPS} />
    </div>
  );
}
