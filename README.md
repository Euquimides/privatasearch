
<p align="center">
	<img src="public/privatasearch_logo.png" alt="PrivataSearch Logo" width="120" />
</p>

# PrivataSearch: Buscador De Resoluciones Sobre Protección De Datos Personales En Costa Rica

PrivataSearch es un buscador de texto completo e inteligente de resoluciones emitidas por la Agencia de Protección de Datos de los Habitantes (PRODHAB) de Costa Rica. Permite realizar búsquedas rápidas sobre el contenido de las resoluciones despersonalizadas disponibles públicamente. El proyecto opera sin conexión a base de datos: se construye sobre un índice JSON generado a partir del conjunto de resoluciones públicas, siguiendo principios de datos abiertos según la legislación costarricense.

## Funcionalidades

- **Búsqueda de texto completo** sobre el contenido de las resoluciones, usando FlexSearch.
- **Similitud semántica** mediante similitud coseno y Máxima Relevancia Marginal (MMR) para sugerir resoluciones relacionadas con cada resultado.
- **Filtros avanzados**: período (rango de años), resultado de la resolución, tipo de procedimiento, tema jurídico (descriptores) y número de resultados por página.
- **Resaltado de coincidencias** para términos de búsqueda y descriptores jurídicos en los resultados.
- **Grafo de citas 3D** interactivo que visualiza la red de citaciones entre resoluciones, con búsqueda integrada y paneles de detalle.
- **Página de estadísticas** con métricas del conjunto de datos, distribución temporal, agrupación temática (clustering), y análisis de resultados y recursos, visualizados con Chart.js.
- **Formularios de inscripción de bases de datos ante PRODHAB** (personas físicas, personas jurídicas y organismos públicos): asistente por secciones con validación, exportación a PDF, Word (DOCX) y Markdown, y guardado/carga del progreso como archivo `.json`. Todo ocurre en el navegador: las respuestas no se envían a ningún servidor y solo se conservan en `sessionStorage` si el usuario activa "mantener mi progreso" (se borran al cerrar la pestaña).
- **Modo oscuro** con persistencia de preferencia del usuario.
- **Sitio completamente estático** exportado como HTML/CSS/JS: no requiere servidor backend.
- **Accesibilidad**: skip-links, roles ARIA, y navegación por teclado.
- **Página de descargo de responsabilidad**.

## Instalación y desarrollo local

Requisitos: Node.js 20 o superior (la versión que usa el despliegue). Python 3 solo si vas a correr el pipeline de limpieza del dataset.

1. Clona el repositorio:
	```bash
	git clone https://github.com/Euquimides/privatasearch.git
	cd privatasearch
	```
2. Instala las dependencias:
	```bash
	npm install
	```
3. Inicia el servidor de desarrollo:
	```bash
	npm run dev
	```
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
5. Corre la suite de pruebas (vitest):
	```bash
	npm test
	```

## Despliegue en GitHub Pages

El proyecto está configurado para exportar el sitio como estático y desplegarlo automáticamente en GitHub Pages usando GitHub Actions.

### Exportar el sitio manualmente
```bash
npm run build
npx serve out
```
Los archivos estáticos se generan en la carpeta `out`. `npm run build` ejecuta antes el `prebuild`, que regenera `public/estadisticas.json`.

> **Importante:** el workflow de GitHub Actions corre `next build` directamente, sin el `prebuild`, así que en producción se usa el `public/estadisticas.json` que esté versionado. Si cambias el dataset, corre `npm run build` localmente y haz commit del `estadisticas.json` actualizado.

## Actualizar el dataset

El script de limpieza solo usa la biblioteca estándar de Python:

```bash
python scripts/clean_prodhab_dataset.py
```

Lee y **sobrescribe** `public/indice-resoluciones-prodhab.json` con el dataset limpio, y escribe `scripts/reporte_de_cambios.json` con la trazabilidad de los cambios (duplicados resueltos, citas agregadas, etc.). Después regenera las estadísticas con `npm run build` (ver arriba).

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx               — Página principal (buscador)
│   ├── layout.tsx             — Layout raíz y metadatos
│   ├── globals.css            — Estilos globales y animaciones
│   ├── estadisticas/page.tsx  — Página de estadísticas y gráficas
│   ├── grafo/page.tsx         — Grafo interactivo 3D de citas
│   ├── disclaimer/page.tsx    — Descargo de responsabilidad
│   └── formularios/
│       ├── page.tsx                     — Índice de formularios de inscripción
│       ├── personas-fisicas/page.tsx    — Formulario para personas físicas
│       ├── personas-juridicas/page.tsx  — Formulario para personas jurídicas
│       └── organismos-publicos/page.tsx — Formulario para organismos públicos
├── components/
│   ├── SearchClient.tsx       — Lógica de búsqueda del lado cliente
│   ├── SearchResults.tsx      — Presentación de resultados
│   ├── SearchConfigPanel.tsx  — Panel de filtros y configuración
│   ├── ReaderOverlay.tsx      — Panel lateral de lectura y resoluciones relacionadas (MMR)
│   ├── CitationGraph.tsx      — Grafo 3D de red de citas (WebGL)
│   ├── SiteHeader.tsx         — Encabezado del sitio
│   ├── DarkModeToggle.tsx     — Toggle de modo oscuro
│   ├── ErrorBoundary.tsx      — Captura de errores en componentes
│   ├── Footer.tsx             — Pie de página
│   └── formularios/
│       ├── FormWizard.tsx     — Asistente por secciones: validación, progreso, importación/exportación
│       ├── FormRenderer.tsx   — Renderiza los campos a partir del schema
│       └── PrivacyNotice.tsx  — Aviso de privacidad del formulario
├── context/
│   └── SearchContext.tsx      — Contexto de búsqueda e índice FlexSearch
├── schemas/
│   ├── form-schema.types.ts            — Tipos del schema de formularios
│   ├── personas-fisicas.schema.ts      — Schema del formulario de personas físicas
│   ├── personas-juridicas.schema.ts    — Schema del formulario de personas jurídicas
│   ├── organismos-publicos.schema.ts   — Schema del formulario de organismos públicos
│   └── shared/baseDatosSections.ts     — Secciones compartidas sobre la base de datos
├── types/
│   └── three-bloom.d.ts      — Tipos para efecto bloom de Three.js
└── utils/
    ├── semanticSimilarity.ts  — Similitud coseno y algoritmo MMR (resoluciones relacionadas, usado en ReaderOverlay)
    ├── statisticsCalculator.ts — Cálculo de estadísticas del dataset
    ├── formatters.ts          — Parseo de secciones legales y formato de citas
    ├── hooks.ts               — Hooks personalizados (debounce, tema oscuro)
    ├── highlightText.tsx      — Resaltado de términos en resultados
    ├── validateForm.ts        — Validación de formularios contra su schema
    ├── coerceImportedValues.ts — Filtra el .json de progreso importado contra el schema
    ├── formDocumentModel.ts   — Modelo común de documento para las exportaciones
    ├── exportToPdf.ts         — Exportación a PDF (pdf-lib)
    ├── exportToDocx.ts        — Exportación a Word (docx)
    ├── exportToMarkdown.ts    — Exportación a Markdown
    └── downloadBlob.ts        — Descarga de archivos generados en el navegador

scripts/
├── generate-stats.mjs          — Precomputa public/estadisticas.json en el prebuild
├── clean_prodhab_dataset.py    — Pipeline de limpieza del dataset de resoluciones
└── reporte_de_cambios.json     — Reporte generado por el pipeline de limpieza

public/
├── indice-resoluciones-prodhab.json  — Índice de resoluciones
└── estadisticas.json                 — Estadísticas precomputadas (generado, no editar a mano)
```

## Tecnologías utilizadas

- [Next.js](https://nextjs.org/) (exportación estática)
- [React](https://react.dev/)
- [FlexSearch](https://github.com/nextapps-de/flexsearch)
- [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/)
- [3D Force Graph](https://github.com/vasturiano/3d-force-graph) + [Three.js](https://threejs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)
- [docx](https://docx.js.org/) y [pdf-lib](https://pdf-lib.js.org/) (exportación de formularios)
- [Vitest](https://vitest.dev/) (pruebas)

## Contribuir

Puedes abrir issues o enviar pull requests (PR) para mejorar el buscador o la interfaz. Para ello haz antes un fork, prueba los cambios respectivos (`npm test`) y envía tu PR.

## Licencia

Este proyecto está bajo la licencia MIT.
