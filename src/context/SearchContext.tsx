"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import FlexSearch from "flexsearch";

// Vocabulario de descriptores temáticos para resoluciones PRODHAB (Costa Rica)
export const DESCRIPTOR_LABELS: Record<string, string> = {
  "consentimiento-informado": "Consentimiento informado",
  "derecho-al-olvido": "Derecho al olvido",
  "derecho-de-acceso": "Derecho de acceso",
  "derecho-de-rectificacion": "Derecho de rectificación",
  "derecho-de-supresion": "Derecho de supresión",
  "autodeterminacion-informativa": "Autodeterminación informativa",
  "datos-sensibles": "Datos sensibles",
  "cesion-de-datos": "Cesión de datos",
  "principio-de-finalidad": "Principio de finalidad",
  "sector-financiero": "Sector financiero",
  "sector-salud": "Sector salud",
  "sector-laboral": "Sector laboral",
  "gestion-de-cobro": "Gestión de cobro",
  "habeas-data": "Habeas data",
  telecomunicaciones: "Telecomunicaciones",
  "registro-bases-de-datos": "Registro de bases de datos",
  "portabilidad-de-datos": "Portabilidad de datos",
  "seguridad-de-los-datos": "Seguridad de los datos",
  "minimizacion-de-datos": "Minimización de datos",
  transparencia: "Transparencia",
  "responsable-del-tratamiento": "Responsable del tratamiento",
  "menores-de-edad": "Personas menores de edad",
  "datos-biometricos": "Datos biométricos",
  "transferencia-internacional": "Transferencia internacional de datos",
  "notificacion-de-brechas": "Notificación de brechas de seguridad",
  "oposicion-al-tratamiento": "Oposición al tratamiento",
  "datos-de-localizacion": "Datos de localización",
  "datos-de-videovigilancia": "Datos de videovigilancia",
};

export const DESCRIPTOR_PATTERNS: [string, RegExp][] = [
  [
    "consentimiento-informado",
    /consentimiento informado|consentimiento expreso|consentimiento del titular|autorizaci[oó]n expresa|permiso del titular|aceptaci[oó]n informada|manifestaci[oó]n de voluntad|consentimiento tácito|consentimiento escrito|consentimiento verbal/i,
  ],
  [
    "derecho-al-olvido",
    /derecho al olvido|eliminaci[oó]n de informaci[oó]n|borrado de datos|supresi[oó]n de informaci[oó]n|retirar informaci[oó]n|derecho a ser olvidado/i,
  ],
  [
    "derecho-de-acceso",
    /derecho de acceso|acceso a (sus|los) datos|solicitud de acceso|consulta de datos|ver mis datos|obtener informaci[oó]n personal|acceso a informaci[oó]n|acceso a expediente/i,
  ],
  [
    "derecho-de-rectificacion",
    /derecho de rectificaci[oó]n|rectificaci[oó]n de datos|correcci[oó]n de datos|actualizaci[oó]n de informaci[oó]n|modificaci[oó]n de datos|rectificar informaci[oó]n|cambiar datos personales/i,
  ],
  [
    "derecho-de-supresion",
    /derecho de supresi[oó]n|supresi[oó]n de datos|cancelaci[oó]n de datos|eliminaci[oó]n de datos|borrado de datos|derecho de cancelaci[oó]n|derecho de eliminaci[oó]n|suprimir informaci[oó]n/i,
  ],
  [
    "autodeterminacion-informativa",
    /autodeterminaci[oó]n informativa|control sobre datos|libertad informativa|autonom[ií]a informativa|decisi[oó]n sobre informaci[oó]n personal|gesti[oó]n de datos propios/i,
  ],
  [
    "datos-sensibles",
    /datos sensibles|datos de salud|informaci[oó]n m[eé]dica|expediente m[eé]dico|informaci[oó]n gen[eé]tica|orientaci[oó]n sexual|creencias religiosas|opiniones pol[ií]ticas|historial cl[ií]nico|diagn[oó]stico m[eé]dico/i,
  ],
  [
    "cesion-de-datos",
    /cesi[oó]n de datos|transferencia de datos|comunicaci[oó]n de datos a terceros|compartir datos|entrega de informaci[oó]n|transmisi[oó]n de datos|divulgaci[oó]n de datos|acceso de terceros/i,
  ],
  [
    "principio-de-finalidad",
    /principio de finalidad|adecuaci[oó]n al fin|fines determinados|fines leg[ií]timos|uso espec[ií]fico de datos|prop[oó]sito determinado|finalidad espec[ií]fica|limitaci[oó]n de finalidad/i,
  ],
  [
    "sector-financiero",
    /\b(banco|financiero|cr[eé]dito|pr[eé]stamo|entidad financiera|SUGEF|Credomatic|BAC|BCR|BNCR|Coopeande|tarjeta de cr[eé]dito|cuenta bancaria|superintendencia financiera|asociaci[oó]n solidarista|cooperativa de ahorro)\b/i,
  ],
  [
    "sector-salud",
    /\b(hospital|cl[ií]nica m[eé]dica|CCSS|Caja Costarricense|centro de salud|EBAIS|expediente cl[ií]nico|servicio de salud|laboratorio cl[ií]nico|datos de salud|informaci[oó]n m[eé]dica)\b/i,
  ],
  [
    "sector-laboral",
    /\b(empleado|empleador|trabajador|contrato de trabajo|relaci[oó]n laboral|planilla|recursos humanos|n[oó]mina|jornada laboral|despido|contrataci[oó]n|liquidaci[oó]n laboral)\b/i,
  ],
  [
    "gestion-de-cobro",
    /gesti[oó]n de cobro|cobro de deuda|llamadas de cobro|cobrador|agencia de cobro|recuperaci[oó]n de cartera|notificaci[oó]n de cobro|proceso de cobro|empresa de cobranza/i,
  ],
  [
    "habeas-data",
    /habeas data|recurso de habeas data|acción de habeas data|solicitud de habeas data/i,
  ],
  [
    "telecomunicaciones",
    /n[uú]mero de tel[eé]fono|correo electr[oó]nico|ICE|Kolbi|Movistar|Claro|datos de contacto|mensaje de texto|SMS|WhatsApp|operador telef[oó]nico|compa[nñ][ií]a telef[oó]nica|servicio de internet/i,
  ],
  [
    "registro-bases-de-datos",
    /registro de (la )?base de datos|inscripci[oó]n de (la )?base de datos|registro de informaci[oó]n|inscripci[oó]n de archivos|registro ante la autoridad|registro de ficheros/i,
  ],
  [
    "portabilidad-de-datos",
    /portabilidad de datos|derecho a la portabilidad|transferencia de informaci[oó]n|migraci[oó]n de datos|cambio de proveedor|traslado de datos|exportaci[oó]n de datos/i,
  ],
  [
    "seguridad-de-los-datos",
    /seguridad de los datos|medidas de seguridad|protecci[oó]n de datos|cifrado de datos|acceso restringido|brecha de seguridad|seguridad inform[aá]tica|pol[ií]tica de seguridad|incidente de seguridad|vulnerabilidad de datos/i,
  ],
  [
    "minimizacion-de-datos",
    /minimizaci[oó]n de datos|solo los datos necesarios|datos estrictamente necesarios|reducci[oó]n de datos|limitaci[oó]n de datos|minimizar informaci[oó]n|principio de minimizaci[oó]n/i,
  ],
  [
    "transparencia",
    /\b(transparencia en el tratamiento|principio de transparencia|deber de transparencia|obligaci[oó]n de transparencia|transparencia informativa|rendici[oó]n de cuentas)\b/i,
  ],
  [
    "responsable-del-tratamiento",
    /responsable del tratamiento|responsable de los datos|encargado de los datos|titular del tratamiento|gestor de datos|administrador de datos|controlador de datos|data controller/i,
  ],
  [
    "menores-de-edad",
    /\b(menores de edad|datos de menores|menor de edad|protecci[oó]n de menores|datos de ni[nñ]os|consentimiento de menores|representante legal del menor|datos infantiles)\b/i,
  ],
  [
    "datos-biometricos",
    /datos biom[eé]tricos|huella dactilar|reconocimiento facial|iris|reconocimiento de voz|patr[oó]n biom[eé]trico|identificaci[oó]n biom[eé]trica|escaneo facial|lectura de retina/i,
  ],
  [
    "transferencia-internacional",
    /transferencia internacional de datos|transferencia transfronteriza|transferencia (de datos )?fuera del (pa[ií]s|territorio)|datos (personales )?(al|en el) exterior|env[ií]o (de datos )?a(l)? extranjero/i,
  ],
  [
    "notificacion-de-brechas",
    /notificaci[oó]n de brechas|incidente de seguridad|brecha de datos|reporte de brecha|aviso de incidente|comunicaci[oó]n de brecha|notificaci[oó]n de incidente|divulgaci[oó]n de brecha/i,
  ],
  [
    "oposicion-al-tratamiento",
    /oposici[oó]n al tratamiento|derecho de oposici[oó]n|rechazo al tratamiento|negativa al tratamiento|oponerse al tratamiento|solicitud de oposici[oó]n|objeci[oó]n al tratamiento/i,
  ],
  [
    "datos-de-localizacion",
    /datos de localizaci[oó]n|ubicaci[oó]n geogr[aá]fica|GPS|coordenadas|rastreo de ubicaci[oó]n|posicionamiento|informaci[oó]n de ubicaci[oó]n|localizaci[oó]n satelital/i,
  ],
  [
    "datos-de-videovigilancia",
    /videovigilancia|c[aá]maras de seguridad|grabaci[oó]n de video|sistema de videovigilancia|circuito cerrado|CCTV|monitorizaci[oó]n visual|registro de im[aá]genes|vigilancia por video/i,
  ],
];

export function tagDescriptores(texto: string): string[] {
  return DESCRIPTOR_PATTERNS.filter(([, pattern]) => pattern.test(texto)).map(
    ([key]) => key,
  );
}

export type ResultadoType =
  | "con_lugar"
  | "sin_lugar"
  | "parcialmente_con_lugar"
  | "archivado"
  | "rechazo_de_plano"
  | "otro";

export type TipoProcedimientoType = "DEN" | "RECONSIDERACION" | "REVOCATORIA";

export const RESULTADO_LABELS: Record<ResultadoType, string> = {
  con_lugar: "Con lugar",
  sin_lugar: "Sin lugar",
  parcialmente_con_lugar: "Parcialmente con lugar",
  archivado: "Archivado",
  rechazo_de_plano: "Rechazo de plano",
  otro: "Otro",
};

// Colores hex por resultado para superficies que no usan clases Tailwind (p.ej. canvas WebGL).
// Mismos tonos semánticos que los badges en SearchResults (emerald/amber/red/orange/blue/neutral).
export const RESULTADO_COLORS: Record<ResultadoType, string> = {
  con_lugar: "#10b981",
  parcialmente_con_lugar: "#f59e0b",
  sin_lugar: "#ef4444",
  archivado: "#a3a3a3",
  rechazo_de_plano: "#f97316",
  otro: "#3b82f6",
};

// Clases Tailwind por resultado para los badges (SearchResults, ReaderOverlay)
// Insignias tipo pastilla (sin borde): relleno tenue + texto del mismo tono.
export const RESULTADO_BADGE_CLASSES: Record<ResultadoType, string> = {
  con_lugar: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  parcialmente_con_lugar: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  sin_lugar: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  archivado: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
  rechazo_de_plano: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  otro: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export const TIPO_LABELS: Record<TipoProcedimientoType, string> = {
  DEN: "Denuncia",
  RECONSIDERACION: "Reconsideración",
  REVOCATORIA: "Revocatoria",
};

export interface ResolutionItem {
  id: string;
  titulo: string;
  texto: string;
  metadatos: {
    expediente?: string;
    resolucion?: string;
    anio?: number | null;
    tipo_procedimiento?: TipoProcedimientoType | null;
    fecha?: string;
    hora?: string;
    lugar?: string;
    denunciante?: string;
    denunciado?: string;
    resultado?: ResultadoType;
    recurso_disponible?: string | null;
    firmante?: string;
    elaborado_por?: string;
    resoluciones_citadas?: string[];
    archivo_origen?: string;
  };
  secciones?: { resultando?: string; considerando?: string; por_tanto?: string };
  vector?: number[];
  descriptores?: string[];
}

interface SearchContextType {
  indexReady: boolean;
  searchResults: ResolutionItem[];
  lastSearchQuery: string | null;
  setLastSearchQuery: (q: string | null) => void;
  search: (query: string, limit?: number) => void;
  queryIndex: (query: string, limit?: number) => ResolutionItem[];
  allItems: ResolutionItem[];
  error: string | null;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearchIndex() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("SearchContext not found");
  return ctx;
}

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [indexReady, setIndexReady] = useState(false);
  const [searchResults, setSearchResults] = useState<ResolutionItem[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<ResolutionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const indexRef = useRef<any>(null);
  // O(1) id→item lookup; evita iterar sobre todos los items para resolver resultados de búsqueda
  const itemMapRef = useRef<Map<string, ResolutionItem>>(new Map());

  // Cargar datos e inicializar índice FlexSearch
  useEffect(() => {
    async function loadData() {
      if (indexRef.current) return;
      try {
        const res = await fetch("/indice-resoluciones-prodhab.json");
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        const json = await res.json();
        const items: ResolutionItem[] = Array.isArray(json.datos)
          ? json.datos.filter((d: any) => d && d.id && d.titulo && d.texto)
          : [];

        if (items.length === 0) {
          throw new Error("No se encontraron resoluciones en el índice");
        }

        // Asignar descriptores temáticos a cada resolución
        items.forEach((item) => {
          item.descriptores = tagDescriptores(item.texto);
        });

        itemMapRef.current = new Map(items.map((item) => [item.id, item]));
        setAllItems(items);
        // Construir índice de documentos FlexSearch
        const idx = new FlexSearch.Document({
          tokenize: "forward",
          cache: true,
          document: {
            id: "id",
            index: ["titulo", "texto"],
          },
        });
        items.forEach((item) =>
          idx.add({
            id: item.id,
            titulo: item.titulo,
            texto: item.texto,
          }),
        );
        indexRef.current = idx;
        setError(null);
        setIndexReady(true);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar datos";
        setError(message);
        setIndexReady(true);
        console.error("Error loading search index:", err);
      }
    }
    loadData();
  }, []);

  // Consulta pura al índice FlexSearch: devuelve los items coincidentes sin mutar estado.
  // Reutilizable desde cualquier vista (búsqueda principal, grafo de citas, etc.).
  const queryIndex = useCallback((query: string, limit: number = 10): ResolutionItem[] => {
    if (!indexRef.current || !query) return [];
    // FlexSearch Document devuelve un array de resultados por cada campo indexado.
    const raw: { result: string[] }[] = indexRef.current.search(query, { limit });
    const seen = new Set<string>();
    const found: ResolutionItem[] = [];
    for (const field of raw) {
      for (const id of field.result) {
        if (!seen.has(id)) {
          seen.add(id);
          const item = itemMapRef.current.get(id);
          if (item) found.push(item);
        }
      }
    }
    return found;
  }, []);

  // Función de búsqueda con estado (vista principal)
  const search = useCallback((query: string, limit: number = 10) => {
    setSearchResults(queryIndex(query, limit));
  }, [queryIndex]);

  return (
    <SearchContext.Provider
      value={{
        indexReady,
        searchResults,
        lastSearchQuery,
        setLastSearchQuery,
        search,
        queryIndex,
        allItems,
        error,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
