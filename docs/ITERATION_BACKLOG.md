# Backlog de iteración

Prioridad: P0 (roto/pérdida de datos/seguridad) → P1 (aprendizaje núcleo) →
P2 (engagement/estadísticas/accesibilidad) → P3 (deleite/pulido secundario).
Puntuación orientativa: Impacto × Confianza / Esfuerzo (1–5).

## P1 — núcleo de aprendizaje

1. **Motor de escritura** (5×5/3): captura de pulsaciones con eventos de
   texto (teclas muertas/acentos correctos), modos aprendizaje vs test,
   conteo de errores/correcciones, latencias por tecla. Independiente de React
   y testeado.
2. **Modelo de progreso + persistencia** (5×5/3): esquema versionado
   (SchemaVersion, LearnerProfile, SessionHistory, KeyStatistics…), capa de
   persistencia con abstracción localStorage/IndexedDB, tests de migración.
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

- 2026-08-16 — Andamiaje (Next 15, TS, Tailwind 4, Vitest, ESLint, cabeceras
  de seguridad), módulo de métricas (PPM/bruta, precisión, tasa de error,
  consistencia robusta, formateo) con tests, página de inicio provisional,
  documentación inicial.
