# Registro de calidad

Auditorías y decisiones importantes, en orden cronológico inverso.

## 2026-08-16 — Pasada de limpieza del currículo (mundo 1)

- El módulo llegó limpio: separación correcta entre contenido
  (`src/data/curriculum/`) y validación (`src/domain/curriculum/`), con el
  contenido dependiendo hacia dentro de los tipos del dominio. Sin cambios
  estructurales.
- Endurecimiento de tests del validador: orden duplicado, más de dos teclas
  introducidas y un solo problema por ejercicio con caracteres no
  disponibles. Cobertura del dominio: 100 % en todo; 95 tests.

## 2026-08-16 — Pasada de limpieza del modelo de progreso

- Extraído `src/domain/progress/guards.ts` con los guardas estructurales
  compartidos; `validate.ts` y `migrations.ts` dependen de él en lugar de
  duplicar comprobaciones y mensajes.
- `MigrationResult` ahora es alias de `ValidationResult` (misma forma).
- La comprobación de avance de versión en migraciones usa `isFiniteNumber`
  (un paso que devuelva `NaN` falla rápido con mensaje claro).
- Tests tabulares que cubren todas las ramas de rechazo de `validateProgress`
  (perfil, ajustes, sesiones, teclas, baseline, ids duplicados) y de
  `migrateToCurrent` (contenido no objeto, versión inválida, paso que no
  avanza). Cobertura del dominio: 100 % en todo; 79 tests.

## 2026-08-16 — Pasada de limpieza del motor de escritura

- `src/domain/engine/session.ts`: sustituido el patrón de clonado con
  mutación externa (`cloneStats`) por `recordAttempt`, una actualización
  encapsulada e inmutable de `KeyStats`; extraído `recordKeystrokeTiming`
  para deduplicar la contabilidad de pulsaciones entre ambos modos.
- Tests de endurecimiento: entrada y retroceso tras completar en modo
  test, latencia en modo test (se reinicia en cada evento, incluido el
  retroceso) y sesión con texto vacío.
- Cobertura del dominio: 100 % en líneas, ramas y funciones; 62 tests.
- Observación (comportamiento existente, no modificado): en modo test la
  sesión se completa al llenar el búfer aunque el último carácter sea
  erróneo, y el retroceso posterior es inerte, así que el último carácter
  no puede corregirse. Decisión de producto pendiente para el coder.

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
