# Backlog de iteración

Prioridad: P0 (roto/pérdida de datos/seguridad) → P1 (aprendizaje núcleo) →
P2 (engagement/estadísticas/accesibilidad) → P3 (deleite/pulido secundario).
Puntuación orientativa: Impacto × Confianza / Esfuerzo (1–5).

## P1 — núcleo de aprendizaje

1. ~~Motor de escritura~~ — hecho (modos aprendizaje y test).
2. ~~Persistencia en navegador~~ — hecho (localStorage tras
   `ProgressStore`; IndexedDB puede sustituirlo detrás de la misma interfaz
   si el volumen lo pide). Export/import UI llega con Ajustes.
3. **Experiencia de lección + teclado virtual ES-ISO** (5×4/4): pantalla de
   lección, resaltado de tecla/dedo, pantalla de resultados.
4. **Currículo por mundos** (5×4/4): capa de contenido data-driven
   (`src/data/curriculum/es/`), validación automática de que cada ejercicio
   solo usa teclas ya permitidas.
5. **Onboarding + baseline** (4×4/3): flujo corto, prueba de nivel, guardado
   permanente de la línea base.
6. **Motor adaptativo** (5×4/4): estadísticas por tecla/bigrama/dedo, modelo
   de debilidad con confianza por muestra, práctica diaria generada.

## P2

7. Dashboard + mapa de curso; estadísticas con gráficas y heatmap de teclado.
8. Gamificación (XP, niveles, estrellas, racha, logros) y celebraciones.
9. Ajustes (nombre/apodo, sonido, reduced motion, objetivo diario) +
   export/import/reset de progreso.
10. Accesibilidad WCAG y E2E Playwright de flujos críticos.

## P3

11. Sonido opcional, microinteracciones, minijuegos, marca refinada.

## Hecho

- 2026-08-16 — Juegos (naves "Invasión Tecleante" y hada "Lluvia de
  Estrellas") con dificultad por mundo y palabras solo de teclas
  desbloqueadas; modo texto con banco de 12 textos originales, escritura
  libre en modo test y ranking persistente; enseñanza real por lección
  (presentación de teclas con dedo/mano/movimiento y consejo destacado);
  Mundos 4 (mayúsculas con técnica Shift a mano contraria) y 5 (puntuación
  y frases reales) — 48 lecciones; Shift en validador y teclado virtual;
  título de pestaña "Bichimeca"; 179 unitarios + 5 E2E.

- 2026-08-16 — Teclado virtual ISO-ES (`src/domain/keyboard/layout.ts` +
  componente): tres filas de letras con ñ y barra espaciadora, dedo asignado
  por tecla, anclas F/J marcadas, resaltado de tecla esperada y estado de
  error (nunca solo color), nombre del dedo bajo el teclado; tests de
  cobertura del currículo completo. Corregida la barra espaciadora
  (keydown explícito, sin depender de beforeinput).
- 2026-08-16 — Experiencia de lección interactiva (LessonRunner con
  beforeinput para caracteres compuestos, resultados con métricas y XP,
  guardado único) + fusión EWMA de estadísticas por tecla.
- 2026-08-16 — Gamificación básica: estrellas por precisión (1/2/3 con
  umbrales configurables, calculadas del historial — sin cambio de esquema)
  y racha de días con gracia de un día; integradas en resultados y mapa de
  curso; 10 tests.
- 2026-08-16 — Persistencia local + mapa de curso: `ProgressStore` sobre
  localStorage (carga con validación/migración; los datos corruptos nunca se
  borran), selectores de progresión (completadas/actual/desbloqueo),
  `ProgressProvider` React, página `/curso` con estados
  completada/actual/bloqueada y página de lección provisional.
- 2026-08-16 — Capa de currículo data-driven (`src/domain/curriculum/` +
  `src/data/curriculum/es/`): tipos de lección/ejercicio, validación
  automática (ids/órdenes únicos, máx. 2 teclas nuevas, ejercicios solo con
  teclas ya introducidas — detectó "lago" con "o" no enseñada) y Mundo 1
  completo (12 lecciones, fila guía progresiva desde F/J con palabras reales
  en cuanto hay letras); 13 tests.
- 2026-08-16 — Esquema de progreso versionado (`src/domain/progress/`):
  ProgressData v1 (perfil con nombre/apodo configurables, ajustes, sesiones,
  estadísticas por tecla, baseline inmutable, XP), validación estructural de
  importaciones (solo datos, nunca ejecución; rechaza NaN/negativos/ids
  duplicados/contadores imposibles) y migraciones por pasos que fallan de
  forma explícita en lugar de borrar datos; 14 tests.
- 2026-08-16 — Motor de escritura (modo test): avance con error sin
  cascadas (alineado por posición), backspace real, errores contados una vez
  en el momento del fallo y nunca borrados, posiciones limpias/corregidas
  juzgadas sobre el buffer final; 10 tests.
- 2026-08-16 — Motor de escritura (modo aprendizaje) en
  `src/domain/engine/session.ts`: sesión pura y determinista, sin cascadas de
  error, posiciones limpias vs corregidas, estadísticas y latencias por tecla
  (desde readiness hasta acierto), resumen integrado con métricas; 17 tests.

- 2026-08-16 — Andamiaje (Next 15, TS, Tailwind 4, Vitest, ESLint, cabeceras
  de seguridad), módulo de métricas (PPM/bruta, precisión, tasa de error,
  consistencia robusta, formateo) con tests, página de inicio provisional,
  documentación inicial.
