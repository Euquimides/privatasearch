import type { FormSchema } from "./form-schema.types";
import { buildBaseDatosSections } from "./shared/baseDatosSections";

/**
 * Esquema del "Formulario para la inscripción del registro de la base de
 * datos (Persona Física)", mapeado directamente contra el Excel oficial
 * de PRODHAB en `forms/FormularioparalaInscripciondelRegistrodelaBasedeDatosparaPersonasFisicas.xlsm`
 * (Versión 2.2, vigente desde 27/04/2017).
 *
 * El Excel numera dos bloques por separado ("Registro de Persona Física"
 * 1–2, luego "Registro de Bases de Datos" 1–12); aquí se aplanan en una
 * sola secuencia 1–14 para el wizard. Se excluye a propósito el "APARTADO
 * EXCLUSIVO PRODHAB" (hoja `Parametros`, fuera de la hoja `Formulario`):
 * es un control interno de la agencia (fecha/hora de recepción,
 * cumple/incumple), no un campo del solicitante.
 *
 * Las 12 secciones "Registro de Bases de Datos" (3-14) son casi
 * idénticas a las de Persona Jurídica y Organismos Públicos — ver
 * `shared/baseDatosSections.ts`, único lugar donde se definen.
 */
export const personasFisicasSchema: FormSchema = {
  id: "personas-fisicas",
  title: "Registro de Persona Física",
  officialVersion: "2.2",
  officialEffectiveDate: "2017-04-27",
  sections: [
    {
      id: "titular",
      number: "1.",
      title: "Datos del titular o representante",
      fields: [
        { id: "apellidos", label: "Apellidos", type: "text", required: true, maxLength: 80, autoComplete: "family-name" },
        { id: "nombre", label: "Nombres", type: "text", required: true, maxLength: 80, autoComplete: "given-name" },
        {
          id: "tipoDocumento",
          label: "Tipo de documento",
          type: "radio",
          required: true,
          options: [
            { value: "CI", label: "Cédula de identidad" },
            { value: "otros", label: "Otros" },
          ],
        },
        {
          id: "tipoDocumentoEspecifique",
          label: "Especifique tipo de documento",
          type: "text",
          required: true,
          visibleWhen: { fieldId: "tipoDocumento", equals: "otros" },
        },
        { id: "numeroDocumento", label: "N.° de documento", type: "text", required: true, maxLength: 20 },
        { id: "nacionalidad", label: "Nacionalidad", type: "text", required: true, maxLength: 40 },
        { id: "actividadProfesional", label: "Actividad profesional", type: "text", maxLength: 120 },
        { id: "correoElectronico", label: "Correo electrónico", type: "email", required: true, autoComplete: "email" },
        { id: "observaciones", label: "Observaciones", type: "textarea", maxLength: 500 },
      ],
    },
    {
      id: "direccionNotificacion",
      number: "2.",
      title: "Dirección a efectos de la notificación",
      fields: [
        { id: "calle", label: "Calle", type: "text", required: true, maxLength: 120 },
        { id: "numero", label: "Número", type: "text", maxLength: 20 },
        { id: "distrito", label: "Distrito", type: "text", required: true, maxLength: 60 },
        { id: "canton", label: "Cantón", type: "text", required: true, maxLength: 60 },
        { id: "provincia", label: "Provincia", type: "text", required: true, maxLength: 60, autoComplete: "address-level1" },
        { id: "detalleDireccion", label: "Más detalles sobre la dirección", type: "textarea", maxLength: 300 },
        { id: "codigoPostal", label: "Código postal", type: "text", maxLength: 10, autoComplete: "postal-code" },
        { id: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel" },
        { id: "correoElectronicoNotif", label: "Correo electrónico", type: "email", autoComplete: "email" },
        { id: "fax", label: "Fax", type: "tel" },
        { id: "aclaracionFirma", label: "Aclaración de firma del representante", type: "text", maxLength: 120 },
        { id: "fechaFirma", label: "Fecha", type: "date", required: true },
      ],
    },
    ...buildBaseDatosSections({
      startNumber: 3,
      personasSometidasLabel: "jurídicas",
      incluyeHipotecas: true,
      incluyeTelefonoCelularYOtros: true,
    }),
  ],
};
