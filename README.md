# Bichimeca

Aplicación web para aprender **mecanografía en español** (teclado ISO-ES):
lecciones estructuradas, aprendizaje adaptativo, precisión antes que
velocidad y progreso persistente en el navegador. Sin cuentas, sin backend,
sin telemetría.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Vitest (unitarios) · ESLint
- Persistencia local-first (localStorage + IndexedDB) con esquema versionado

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
```

## Calidad

```bash
npm run lint
npm run typecheck
npm run test       # unitarios (Vitest)
npm run build      # build de producción
npm run verify     # todo lo anterior en orden
```

## Despliegue (Vercel)

Importar el repositorio en Vercel; se detecta Next.js automáticamente. No se
requieren variables de entorno para el funcionamiento básico.

## Arquitectura (resumen)

- `src/domain/` — lógica de aprendizaje pura y testeable (métricas, motor de
  escritura, progreso, adaptación), independiente de React.
- `src/app/` — UI (App Router).
- `src/data/curriculum/` — contenido de lecciones, validado por tests.
- `e2e/` — flujos críticos con Playwright (`npm run test:e2e`).
- `docs/` — [PRODUCT_SPEC](docs/PRODUCT_SPEC.md) ·
  [PEDAGOGY](docs/PEDAGOGY.md) · [ITERATION_BACKLOG](docs/ITERATION_BACKLOG.md) ·
  [QUALITY_LOG](docs/QUALITY_LOG.md)
