import type { ResolutionItem } from "@/context/SearchContext";

export interface TextSection {
  label: string;
  text: string;
}

export function parseResolutionText(
  texto: string,
  secciones?: { resultando?: string; considerando?: string; por_tanto?: string },
): TextSection[] {
  // ponytail: usar secciones preprocesadas del dataset cuando estén disponibles
  if (secciones && (secciones.resultando || secciones.considerando || secciones.por_tanto)) {
    let { considerando, por_tanto } = secciones;
    // Algunos campos por_tanto fueron cortados en un "por tanto" en minúsculas a mitad de oración
    // (~65 registros); el fallo real comienza en "POR TANTO" en mayúsculas.
    // Se recorta ahí y se devuelve el prefijo mal atribuido al considerando.
    if (por_tanto) {
      const m = /POR\s+(?:LO\s+)?TANTO/.exec(por_tanto);
      if (m && m.index > 0) {
        considerando = ((considerando ?? "") + " " + por_tanto.slice(0, m.index)).trim();
        por_tanto = por_tanto.slice(m.index);
      }
    }

    const sections: TextSection[] = [];
    const firstContent = secciones.resultando || considerando || por_tanto || "";
    const headerEnd = texto.indexOf(firstContent.slice(0, 60));
    const header = headerEnd > 0 ? texto.slice(0, headerEnd).trim() : "";
    if (header) sections.push({ label: "Encabezado", text: header });
    if (secciones.resultando) sections.push({ label: "Resultando", text: secciones.resultando });
    if (considerando) sections.push({ label: "Considerando", text: considerando });
    if (por_tanto) sections.push({ label: "Por tanto", text: por_tanto });
    return sections;
  }

  const markers = [
    { key: "RESULTANDO", label: "Resultando" },
    { key: "CONSIDERANDO", label: "Considerando" },
    { key: "POR TANTO", label: "Por tanto" },
    { key: "POR LO TANTO", label: "Por tanto" },
  ];

  const found: { label: string; index: number }[] = [];
  for (const m of markers) {
    let start = 0;
    while (start < texto.length) {
      const idx = texto.indexOf(m.key, start);
      if (idx === -1) break;
      found.push({ label: m.label, index: idx });
      start = idx + m.key.length;
    }
  }
  found.sort((a, b) => a.index - b.index);

  // Deduplicar marcadores consecutivos con la misma etiqueta (conservar última ocurrencia)
  const deduped = found.filter((f, i) =>
    i === found.length - 1 || f.label !== found[i + 1].label,
  );

  if (deduped.length === 0) {
    return [{ label: "Texto", text: texto.trim() }];
  }

  const sections: TextSection[] = [];
  const rawHeader = texto.slice(0, deduped[0].index).trim();
  if (rawHeader) {
    // ponytail: si el encabezado es muy extenso (no se encontró RESULTANDO/CONSIDERANDO),
    // dividir en el primer límite de oración en encabezado real + "Análisis"
    if (rawHeader.length > 500) {
      const cutoff = rawHeader.indexOf(". ", 80);
      if (cutoff !== -1 && cutoff < rawHeader.length - 100) {
        sections.push({ label: "Encabezado", text: rawHeader.slice(0, cutoff + 1).trim() });
        sections.push({ label: "Análisis", text: rawHeader.slice(cutoff + 2).trim() });
      } else {
        sections.push({ label: "Texto", text: rawHeader });
      }
    } else {
      sections.push({ label: "Encabezado", text: rawHeader });
    }
  }

  for (let i = 0; i < deduped.length; i++) {
    const end = i + 1 < deduped.length ? deduped[i + 1].index : texto.length;
    const text = texto.slice(deduped[i].index, end).trim();
    sections.push({ label: deduped[i].label, text });
  }

  return sections;
}

// ponytail: marcadores de estructura legal — ítems numerados, secciones romanas (espacio
// después del punto es opcional: "I.HECHOS" es común), encabezados con nombre.
const PARAGRAPH_MARKERS =
  /(?=\s-\s*\d+[\.\-])|(?=\s\d+-(?:Que|que)\b)|(?=\s[IVX]+[\.\-]\s*[A-ZÁÉÍÓÚ])|(?<![IVX][\.\-]\s?)(?=\bHECHOS\s+(?:NO\s+)?PROBADOS\b)|(?<![IVX][\.\-]\s?)(?=\bSOBRE EL FONDO\b)|(?=\bNOTIF[IÍ]QUESE\b)/;

function groupSentences(text: string): string[] {
  // Dividir en límites de oración, pero no después de abreviaturas como "Ley No. 8968"
  // o "art. 9" — una oración real no continúa con un dígito o letra minúscula —
  // ni después de un enumerador suelto ("… datos. 2. Llame …").
  const sentences = text.split(/(?<=\.)(?<!(?<![\p{L}\p{N}])\d{1,3}\.)\s+(?=[^\p{Ll}\d])/u);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    out.push(sentences.slice(i, i + 3).join(" "));
  }
  return out;
}

export function splitIntoParagraphs(text: string): string[] {
  // Dividir en marcadores de estructura, luego agrupar oraciones en bloques aún muy largos
  // (p.ej. el razonamiento de SOBRE EL FONDO puede tener decenas de miles de caracteres).
  return text
    .split(PARAGRAPH_MARKERS)
    .map((p) => p.trim())
    .filter((p) => /[\p{L}\p{N}]/u.test(p)) // descartar fragmentos solo de puntuación
    .flatMap((p) => (p.length > 1200 ? groupSentences(p) : [p]));
}

// Marcadores de valor no disponible producidos por el pipeline de limpieza de datos
// (public/indice-resoluciones-prodhab.json) para campos que no pudieron inferirse.
const SIN_DATO = new Set(["No especificado", "Fecha no especificada"]);
export const tieneDato = (v?: string | null): v is string => !!v && !SIN_DATO.has(v);

export function formatCitaCR(item: ResolutionItem): string {
  const parts: string[] = ["Agencia de Protección de Datos de los Habitantes (PRODHAB)"];
  if (item.metadatos?.resolucion) parts.push(`Resolución N.° ${item.metadatos.resolucion}`);
  if (item.metadatos?.expediente) parts.push(`Expediente ${item.metadatos.expediente}`);
  if (tieneDato(item.metadatos?.fecha)) {
    const d = new Date(item.metadatos.fecha + "T00:00:00");
    const hora = tieneDato(item.metadatos.hora) ? item.metadatos.hora : null;
    const fechaLarga = d.toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
    parts.push(hora ? `de las ${hora} horas del ${fechaLarga}` : fechaLarga);
  }
  if (tieneDato(item.metadatos?.lugar)) parts.push(`${item.metadatos.lugar}, Costa Rica`);
  return parts.join(", ") + ".";
}

export function fmtFecha(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}
