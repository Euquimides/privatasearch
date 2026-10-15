/**
 * Tipos que describen un formulario de inscripción PRODHAB como datos
 * (ver PRD sección 9: "los formularios deben definirse como datos, no
 * JSX hardcodeado"). Un solo `FormRenderer` (src/components/formularios)
 * consume estos tipos para los 3 formularios.
 */

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "textarea"
  | "radio"
  | "checkboxGroup"
  | "repeatableGroup";

export type FieldOption = { value: string; label: string };

/** Muestra el campo solo si `fieldId` tiene (o incluye, para checkboxGroup) `equals`. */
export type VisibilityRule = { fieldId: string; equals: string };

interface BaseField {
  id: string;
  label: string;
  required?: boolean;
  visibleWhen?: VisibilityRule;
}

export interface TextField extends BaseField {
  type: "text" | "email" | "tel" | "date";
  maxLength?: number;
  /** Token HTML `autocomplete` (WCAG 1.3.5). Solo en campos sobre quien llena el formulario. */
  autoComplete?: string;
}

export interface TextareaField extends BaseField {
  type: "textarea";
  maxLength?: number;
}

export interface RadioField extends BaseField {
  type: "radio";
  options: FieldOption[];
}

export interface CheckboxGroupField extends BaseField {
  type: "checkboxGroup";
  options: FieldOption[];
}

export interface RepeatableGroupField extends BaseField {
  type: "repeatableGroup";
  minItems?: number;
  maxItems?: number;
  fields: SimpleField[];
}

/** Campos permitidos dentro de un repeatableGroup (sin anidar otro repeatableGroup). */
export type SimpleField = TextField | TextareaField | RadioField | CheckboxGroupField;

export type FormField = SimpleField | RepeatableGroupField;

export interface FormSection {
  id: string;
  number: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormSchema {
  id: string;
  title: string;
  officialVersion: string;
  officialEffectiveDate: string;
  sections: FormSection[];
}

/** checkboxGroup -> string[]; repeatableGroup -> objeto[]; el resto -> string. */
export type FieldValue = string | string[] | Record<string, string>[];

export type FormValues = Record<string, FieldValue | undefined>;
