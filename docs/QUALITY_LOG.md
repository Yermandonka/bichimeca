# Registro de calidad

Auditorías y decisiones importantes, en orden cronológico inverso.

## 2026-08-16 — Pasada de limpieza de dinámicas de juego

- `lockOn.ts` llegó como máquina de estados pura y bien testeada; sin
  cambios.
- `gameWordPool`/`gameDifficulty` aceptan ahora `progress: null` (carga
  pendiente): elimina el literal de dificultad duplicado en ambas páginas
  de juego y simplifica sus memos. Tests para ambos casos null.
- Arreglado `prefer-const` en `lockOn.test.ts` (bloqueaba `npm run lint`).
- Observación (sin cambio): `naves` y `magia` comparten el andamiaje de
  juego (vidas, reloj de ticks, spawn, contabilidad de pulsaciones) en
  ~700 líneas de UI; las dinámicas divergen a propósito. Si aparece un
  tercer juego, conviene extraer un hook común de bucle de juego.
- 195 tests; todo al 100 % de cobertura.

## 2026-08-16 — Pasada de limpieza de juegos, texto libre y mundos 4–5

- Buena arquitectura de la entrega: material y dificultad de los juegos en
  dominio (`wordPool.ts`), guía pedagógica por tecla en dominio
  (`teaching.ts`) y el bucle del juego (temporizadores/aleatoriedad) como
  límite de UI. Sin cambios estructurales.
- Cobertura recuperada al 100 %: tests nuevos para la guía de Shift
  (regla del meñique contrario), `requiresShift`, puntuación con Shift
  resuelta a su tecla base, dificultad con currículo vacío o mundo sin
  nivel definido, y descarte de fichas de un solo carácter en el pool.
- `LessonRunner`: aserciones no nulas de la fase de introducción
  sustituidas por un `flatMap` con estrechamiento de tipos.
- 186 tests; todo al 100 %. La suite e2e sigue siendo del coder.

## 2026-08-16 — Pasada de limpieza de consejos del mundo 1

- Entrega de solo datos/documentación/activos (consejos del mundo 1,
  favicon, spec actualizada); nada que reestructurar.
- Test de invariante nuevo: toda lección tiene `tip` (la spec lo afirma
  como característica del currículo). 162 tests; todo al 100 %.

## 2026-08-16 — Pasada de limpieza de mundos 2–3, tema oscuro y e2e

- Contenido de los mundos 2–3 validado por las puertas existentes: el
  validador de currículo garantiza estructuralmente la afirmación «sin
  letras de la fila inferior en el mundo 2» (esas teclas se introducen en
  el mundo 3) y el cross-check del teclado cubre cada carácter nuevo.
- Tests de invariantes de datos nuevos: cada mundo tiene título en
  `WORLD_TITLES` y los mundos son contiguos por orden (supuesto de los
  encabezados del mapa del curso). Todo al 100 %; 161 tests.
- La suite e2e de Playwright es del coder; el cleaner no la ejecuta ni la
  mantiene (verificación por tests unitarios y `npm run verify` según las
  reglas del proyecto).
- Observación (sin cambio): el retema oscuro reutiliza los tokens
  `brand-50/100` con semántica de superficie («legacy-named tokens»);
  si la paleta crece, conviene renombrar a tokens semánticos
  (`surface`, `border`) para evitar confusión.

## 2026-08-16 — Pasada de limpieza del panel de inicio

- `recentAverages` reescrita con un helper `average`: elimina la media
  duplicada, el cast `as number` y la salida temprana redundante (la lista
  vacía produce null de forma natural).
- Test de límite con ventana+1 sesiones y velocidades distintas: mata el
  mutante `slice(-N)` → `slice(N)`, indistinguible con los datos simétricos
  del test original. Todo al 100 %; 159 tests.
- Observación para el coder (sin cambio): la racha compara el día local del
  navegador (`localDay` en `page.tsx`) con días UTC de `completedAt`
  (`dayOf` recorta el ISO). Práctica cerca de medianoche local puede caer
  en el día UTC anterior. La regla «viva hasta ayer» amortigua la mayoría
  de casos; decidir zona única (todo local o todo UTC) cuando la racha
  gane visibilidad.

## 2026-08-16 — Pasada de limpieza del teclado virtual

- El módulo llegó limpio: modelo puro del teclado en dominio, componente
  visual como límite de UI y cross-check contra el currículo en tests. Sin
  cambios estructurales ni de código.
- Endurecimiento: test del patrón estándar de dedos aplicado a las tres
  filas (fija la asignación de cada tecla, no solo la fila guía) y del
  pulgar para la barra espaciadora. Todo al 100 %; 154 tests.

## 2026-08-16 — Pasada de limpieza de gamificación

- `practiceStreak` simplificada: eliminadas dos salidas tempranas
  redundantes que el bucle principal ya cubría.
- Página del curso: `lessonStars` se calcula una vez por lección en lugar
  de dos veces por render.
- Tests nuevos: racha que cruza el límite de mes y `lessonStars` ignorando
  sesiones de otras lecciones. Todo al 100 % de cobertura; 143 tests.

## 2026-08-16 — Pasada de limpieza de la experiencia de lección

- Lógica pura extraída de `LessonRunner.tsx` a `src/domain/engine/aggregate.ts`
  (`combineKeyStats`, `combineSummaries`, tipo `LessonTotals`): la agregación
  de ejercicios en totales de lección ahora es testeable y reutiliza
  `ppm`/`rawPpm`/`accuracy` del dominio en lugar de reimplementarlas inline.
- `src/domain/curriculum/ordering.ts` nuevo con `byOrder` y `nextLessonAfter`;
  elimina la tercera copia de la ordenación del currículo (LessonRunner) y
  los selectores de progreso dependen de él.
- `median` unificada en `src/domain/metrics/stats.ts` (antes duplicada en
  `metrics.ts` y `keyStats.ts`); lanza error con lista vacía y los llamadores
  guardan el caso vacío explícitamente.
- Tests para los tres módulos nuevos y para la rama de cero intentos en
  `keyStats`. Todo al 100 % de cobertura; 131 tests.

## 2026-08-16 — Pasada de limpieza de persistencia y selectores

- `selectors.ts`: extraído `byOrder` para no duplicar la ordenación del
  currículo; tests nuevos con el array desordenado que fijan que la lógica
  sigue el campo `order` y no el orden del array.
- Cobertura ampliada a `src/infrastructure/**` (el adaptador de storage es
  testeable por inyección). Todo al 100 %; 111 tests.
- `LESSON_TYPE_LABELS` tipado como `Record<LessonType, string>`: una
  etiqueta que falte rompe la compilación en vez de caer en silencio al
  identificador interno.
- Observación para el coder (sin cambio): `progressStore.save` no captura
  `QuotaExceededError` de localStorage; si el guardado falla lanzaría dentro
  del updater de React. Dado que la pérdida de progreso es P0, conviene
  decidir una estrategia (capturar y avisar, o reintentar).

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
