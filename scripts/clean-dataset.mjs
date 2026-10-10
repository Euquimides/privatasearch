// Limpia el índice en sitio (idempotente; npm run build lo ejecuta vía prebuild):
// separa marcadores de anonimización pegados, enmascara cédulas físicas y celulares
// que el texto fuente dejó visibles, y extrae el denunciado del encabezado cuando falta.
// Trabaja línea a línea sobre el JSON crudo para no reformatear los vectores.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "public/indice-resoluciones-prodhab.json";
const MARKER = String.raw`(?:NOMBRE|CORREO(?: ELECTR[ÓO]NICO)?|CELULAR|TEL[ÉE]FONO|C[ÉE]DULA|DIRECCI[ÓO]N) \d+`;
const LETTER = "A-Za-zÁÉÍÓÚÑáéíóúñü";

export function cleanText(s) {
  return s
    .replace(new RegExp(`([${LETTER}])(${MARKER})`, "g"), "$1 $2")
    .replace(new RegExp(`(${MARKER})(?=[${LETTER}])`, "g"), "$1 ")
    // "NOMBRE 22-0651-0747": marcador pegado a una cédula
    .replace(/(NOMBRE \d)(\d-\d{4}-\d{4})/g, "$1 $2")
    // Cédula física: 1-1425-0348 o 111290133 (primer dígito ≠ 3; 3-1xx-… son jurídicas, públicas)
    .replace(/(?<![\d-])[124-9]-\d{4}-\d{4}(?![\d-])/g, "[CÉDULA]")
    .replace(/(c[ée]dula[^.\d]{0,30})(?<!jur[ií]dica[^.\d]{0,30})\b[124-9]\d{8}\b/gi, "$1[CÉDULA]")
    // ponytail: solo celulares (5-8xxx); fijos 2xxx chocan con rangos de años, enmascarar a mano si aparecen
    // Excluye "voto 5802-1999" / "Resolución 6793-2007"
    .replace(/(?<![\d-])[5-8]\d{3}-(?!(?:19|20)\d\d(?![\d-]))\d{4}(?![\d-])/g, "[TELÉFONO]");
}

// Correcciones ortográficas/de redacción de los títulos generados por el LLM (idempotentes)
const TITLE_FIXES = [
  [/без/g, "sin"],
  [/deseorectificación/g, "rectificación"],
  [/candelada/g, "cancelada"],
  [/\bAbertura\b/g, "Apertura"],
  [/Uso indebidamente datos/g, "Uso indebido de datos"],
  [/\btramite\b/g, "trámite"],
  [/NorTEAMERICANO/g, "Norteamericano"],
  [/\bco-deudor/g, "codeudor"],
  [/partes acreditados/g, "partes acreditadas"],
  [/(?<!auto)determinación informativa/g, "autodeterminación informativa"],
  [/Cobros cobratorios/g, "Cobros"],
  [/Contacto con terceros por deuda solicitado cese/g, "Solicitud de cese de contacto con terceros por deuda"],
  [/sobre deuda solicitan eliminación/g, "sobre deuda y solicitud de eliminación"],
  [/\b(Coopejudicial R\.L|Servicoop R|COOPENAE R)(?![.\w])/g, (m) => (m.endsWith("R") ? m + ".L." : m + ".")],
  [/Camposanto la Piedad/g, "Camposanto La Piedad"],
  [/\bburo\b/g, "buró"],
  [/ y Douglas Soto/g, ""], // nombre de persona física en un dataset anonimizado
];
export function cleanTitle(s) {
  return TITLE_FIXES.reduce((acc, [re, to]) => acc.replace(re, to), s).trim();
}

export function extractDenunciado(texto) {
  const head = cleanText(texto).split(/RESULTANDO/)[0];
  const m = head.match(/\bcontra\s+(?:la |el |los |las )?(.+?)\s*$/i);
  if (!m) return null;
  const v = m[1].replace(/\s*\(.*?\)\s*/g, " ").trim()
    .replace(/[,;]$/, "")
    .replace(/(?<!\.[A-ZÁÉÍÓÚÑ])\.$/, "") // quita el punto final pero conserva "S.A."
    .trim();
  // Solo entidades en mayúsculas; descarta encabezados de recursos ("resolución No …")
  return /^[A-ZÁÉÍÓÚÑ]{2}/.test(v) && !/^NOMBRE|[()]/.test(v) && v.length <= 150 && !new RegExp(`^${MARKER}$`).test(v) ? v : null;
}

const TEXT_LINE = /^(\s*"(?:titulo|texto|resultando|considerando|por_tanto)": )(".*")(,?\r?)$/;
const DEN_LINE = /^(\s*"denunciado": )"No especificado"(,?\r?)$/;

if (process.argv[1]?.endsWith("clean-dataset.mjs")) {
  const raw = readFileSync(FILE, "utf8");
  const datos = JSON.parse(raw).datos;
  let rec = -1, inDatos = false, textos = 0, den = 0;
  const out = raw.split("\n").map((line) => {
    if (/^\s*"datos": \[/.test(line)) inDatos = true;
    if (!inDatos) return line;
    if (/^\s*"id": "/.test(line)) rec++;
    const t = line.match(TEXT_LINE);
    if (t) {
      const fix = t[1].includes('"titulo"') ? (x) => cleanTitle(cleanText(x)) : cleanText;
      const cleaned = JSON.stringify(fix(JSON.parse(t[2])));
      if (cleaned !== t[2]) textos++;
      return t[1] + cleaned + t[3];
    }
    const d = line.match(DEN_LINE);
    const v = d && extractDenunciado(datos[rec].texto);
    if (v) { den++; return d[1] + JSON.stringify(v) + d[2]; }
    return line;
  }).join("\n");
  JSON.parse(out); // falla antes de escribir si se rompió el JSON
  writeFileSync(FILE, out);
  console.log(`clean-dataset: ${textos} campos de texto y ${den} denunciados actualizados`);
}
