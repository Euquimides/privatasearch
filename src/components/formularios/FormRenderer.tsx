"use client";

import type { FormField, FormSection, FormValues, SimpleField } from "@/schemas/form-schema.types";
import { isFieldVisible } from "@/utils/validateForm";

type ErrorMap = Record<string, string>;

const inputClass =
  "w-full rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 transition-all focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20";

const optionClass =
  "flex min-h-6 items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 accent-blue-600";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function FieldLabel({ field, htmlFor }: { field: FormField; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
      {field.label}
      {field.required && <span aria-hidden="true" className="text-red-600 dark:text-red-400"> *</span>}
    </label>
  );
}

/**
 * `inputId` namespaces id/name/aria-describedby: dentro de un
 * repeatableGroup varias filas repiten el mismo `field.id`, así que el
 * llamador pasa un id único por fila (`${groupId}.${index}.${field.id}`)
 * para no duplicar ids en el DOM ni fusionar los radios de cada fila en
 * un solo grupo.
 */
function SimpleFieldInput({
  field,
  inputId,
  value,
  error,
  onChange,
}: {
  field: SimpleField;
  inputId: string;
  value: string | string[] | undefined;
  error?: string;
  onChange: (value: string | string[]) => void;
}) {
  const errorId = `${inputId}-error`;

  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "date":
      return (
        <div>
          <FieldLabel field={field} htmlFor={inputId} />
          <input
            id={inputId}
            type={field.type}
            className={inputClass}
            value={(value as string) ?? ""}
            maxLength={field.maxLength}
            required={field.required}
            autoComplete={field.autoComplete}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
          <FieldError id={errorId} message={error} />
        </div>
      );
    case "textarea":
      return (
        <div>
          <FieldLabel field={field} htmlFor={inputId} />
          <textarea
            id={inputId}
            className={inputClass}
            rows={4}
            value={(value as string) ?? ""}
            maxLength={field.maxLength}
            required={field.required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
          <FieldError id={errorId} message={error} />
        </div>
      );
    case "radio":
      return (
        <fieldset
          role="radiogroup"
          aria-required={field.required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        >
          <legend className="mb-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {field.label}
            {field.required && <span aria-hidden="true" className="text-red-600 dark:text-red-400"> *</span>}
          </legend>
          <div className="flex flex-wrap gap-4">
            {field.options.map((option) => (
              <label key={option.value} className={optionClass}>
                <input
                  type="radio"
                  name={inputId}
                  value={option.value}
                  required={field.required}
                  aria-invalid={Boolean(error)}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <FieldError id={errorId} message={error} />
        </fieldset>
      );
    case "checkboxGroup": {
      const selected = (value as string[]) ?? [];
      return (
        <fieldset aria-describedby={error ? errorId : undefined}>
          <legend className="mb-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {field.label}
            {field.required && <span aria-hidden="true" className="text-red-600 dark:text-red-400"> *</span>}
          </legend>
          <div className="flex flex-wrap gap-4">
            {field.options.map((option) => (
              <label key={option.value} className={optionClass}>
                <input
                  type="checkbox"
                  aria-invalid={Boolean(error)}
                  value={option.value}
                  checked={selected.includes(option.value)}
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...selected, option.value]
                        : selected.filter((v) => v !== option.value)
                    )
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
          <FieldError id={errorId} message={error} />
        </fieldset>
      );
    }
  }
}

/** Renderiza todos los campos visibles de una sección del schema. */
export function FormRenderer({
  section,
  values,
  errors,
  onChange,
}: {
  section: FormSection;
  values: FormValues;
  errors: ErrorMap;
  onChange: (fieldId: string, value: string | string[] | Record<string, string>[]) => void;
}) {
  return (
    <div className="space-y-6">
      {section.description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{section.description}</p>
      )}
      {section.fields.map((field) => {
        if (!isFieldVisible(field, values)) return null;

        if (field.type === "repeatableGroup") {
          const items = (values[field.id] as Record<string, string>[] | undefined) ?? [];
          const canAdd = !field.maxItems || items.length < field.maxItems;
          const canRemove = !field.minItems || items.length > field.minItems;
          const groupErrorId = `${field.id}-error`;
          return (
            <div key={field.id} className="space-y-4">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{field.label}</p>
              <FieldError id={groupErrorId} message={errors[field.id]} />
              {items.map((item, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/60 dark:bg-neutral-900/40 p-4"
                >
                  {field.fields.map((subField) => (
                    <SimpleFieldInput
                      key={subField.id}
                      field={subField}
                      inputId={`${field.id}.${index}.${subField.id}`}
                      value={item[subField.id]}
                      error={errors[`${field.id}.${index}.${subField.id}`]}
                      onChange={(value) => {
                        const next = items.map((it, i) =>
                          i === index ? { ...it, [subField.id]: value as string } : it
                        );
                        onChange(field.id, next);
                      }}
                    />
                  ))}
                  {canRemove && (
                    <button
                      type="button"
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      onClick={() => onChange(field.id, items.filter((_, i) => i !== index))}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
              {canAdd && (
                <button
                  type="button"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() =>
                    onChange(
                      field.id,
                      items.concat([Object.fromEntries(field.fields.map((f) => [f.id, ""]))])
                    )
                  }
                >
                  + Agregar {field.label.toLowerCase()}
                </button>
              )}
            </div>
          );
        }

        return (
          <SimpleFieldInput
            key={field.id}
            field={field}
            inputId={field.id}
            value={values[field.id] as string | string[] | undefined}
            error={errors[field.id]}
            onChange={(value) => onChange(field.id, value)}
          />
        );
      })}
    </div>
  );
}
