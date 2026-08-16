# Registro de calidad

Auditorías y decisiones importantes, en orden cronológico inverso.

## 2026-08-16 — Pasada de limpieza del motor de métricas

- Deduplicación en `src/domain/metrics/metrics.ts`: helper común de
  caracteres→PPM (`ppm`/`rawPpm`) y de fracción 0..1 con clamp
  (`accuracy`/`errorRate`).
- Eliminada la guarda muerta `med <= 0` en `consistencyScore` (los
  intervalos válidos son estrictamente positivos).
- Endurecimiento por mutación (manual; no hay herramienta de mutación
  sancionada para TypeScript): tests nuevos para entradas negativas,
  clamps 0..1, el límite exacto de `MIN_INTERVALS_FOR_CONSISTENCY` y la
  mediana con número impar de intervalos.
- Cobertura acotada a módulos testeables (`src/domain/**`) en
  `vitest.config.ts`; añadido `@vitest/coverage-v8`. Resultado: 100 %
  de líneas, ramas y funciones en el dominio; 31 tests.
- `coverage/` ignorado en git y eslint.

## 2026-08-16 — Línea base inicial

- Repo previo: solo infraestructura SwarmForge; sin código de aplicación.
- Andamiaje creado a mano (el directorio no estaba vacío para create-next-app).
- Puertas verificadas en local: `npm run lint`, `npm run typecheck`,
  `npm run test`, `npm run build` (ver commit).
- Cabeceras de seguridad básicas en `next.config.ts`; sin dependencias más
  allá del stack base; sin peticiones externas en runtime.
- Regla permanente: la pérdida de progreso de la aprendiz es un bug P0; toda
  migración de esquema llevará tests antes de publicarse.
