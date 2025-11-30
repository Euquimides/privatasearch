
<p align="center">
	<img src="public/privatasearch_logo.png" alt="PrivataSearch Logo" width="120" />
</p>

# PrivataSearch: Buscador De Resoluciones Sobre Protección De Datos Personales En Costa Rica

Este proyecto es un buscador textual de resoluciones sobre protección de datos personales en Costa Rica, en específico, de la Agencia de Protección de datos de los Habitantes (PRODHAB). Permite realizar búsquedas rápidas sobre el contenido de las resoluciones emitidas hasta hoy. Este proyecto no tiene conexión a base de datos alguna, sino que se construyo sobre un dataset reorganizado y creado a partir de las resoluciones despersonalizadas, pensando en principios de datos abiertos según legislación costarricense. 

## Instalación y desarrollo local

1. Clona el repositorio:
	```bash
	git clone https://github.com/Euquimides/prodhab-search.git
	cd prodhab-search
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

## Despliegue en GitHub Pages

El proyecto está configurado para exportar el sitio como estático y desplegarlo automáticamente en GitHub Pages usando GitHub Actions.

### Exportar el sitio manualmente
```bash
npm run build
npx serve .out
```
Los archivos estáticos se generan en la carpeta `out`.

## Estructura del proyecto

- `src/app/` — Páginas principales y layout.
- `src/components/` — Componentes reutilizables (buscador, resultados, UI).
- `src/context/` — Contexto de búsqueda y carga del índice.
- `public/indice-resoluciones-prodhab.json` — Índice de resoluciones para búsqueda.

## Tecnologías utilizadas
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [FlexSearch](https://github.com/nextapps-de/flexsearch)
- [TailwindCSS](https://tailwindcss.com/)

## Contribuir

Puedes abrir issues o enviar pull requests (PR) para mejorar el buscador o la interfaz. Para ello realice antes un fork,
prueba los cambios respectivos y envie su PR. 

## Licencia

Este proyecto está bajo la licencia MIT.
