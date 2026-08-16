# Bichimeca — Especificación de producto

Fuente de verdad viva del comportamiento del producto. Se actualiza en cada
iteración relevante.

## Qué es

Aplicación web que enseña mecanografía en español (teclado ISO-ES) a una
aprendiz principal, **Estrella** (apodo opcional: *bichi*), en un portátil.
Producto de aprendizaje adaptativo completo, no un simple test de velocidad.

- UI 100 % en español de España.
- Local-first: sin cuentas, sin backend, sin telemetría. Progreso en el
  navegador (localStorage + IndexedDB) con esquema versionado, export/import.
- Desplegable en Vercel desde GitHub sin variables de entorno secretas.
- El nombre y el apodo de la aprendiz son configurables en Ajustes
  (por defecto: `Estrella` / `bichi`); nunca se codifican por pantalla.

## Convenciones de métricas (implementadas en `src/domain/metrics/`)

- **PPM (palabras por minuto)**: 1 palabra = 5 caracteres. Métrica principal
  de velocidad mostrada a la aprendiz.
  - PPM neta = (caracteres correctos / 5) / minutos.
  - PPM bruta = (caracteres totales / 5) / minutos (uso interno/diagnóstico).
- **Precisión** = pulsaciones correctas / pulsaciones relevantes, mostrada en
  porcentaje con un decimal ("96.9 %"). Sin datos → "—", nunca NaN.
- **Consistencia (ritmo)** = 0..100 a partir de la dispersión robusta
  (MAD/mediana) de los intervalos entre pulsaciones; una pausa aislada no
  distorsiona la métrica. Con < 5 intervalos → sin dato.
- **Tasa de error** = errores / pulsaciones relevantes.
- Ninguna métrica puede ser NaN, Infinity ni negativa (puerta de calidad).

## Estado actual

- [x] Andamiaje Next.js 15 + TypeScript + Tailwind 4 + Vitest + ESLint.
- [x] Módulo de métricas con tests deterministas.
- [x] Página de inicio provisional con identidad inicial.
- [ ] Motor de escritura (captura de pulsaciones, modos aprendizaje/test).
- [ ] Modelo de progreso persistente y migraciones.
- [ ] Onboarding + prueba de nivel (baseline).
- [ ] Lecciones, teclado virtual ES-ISO, currículo por mundos.
- [ ] Motor adaptativo, práctica diaria, estadísticas, logros, ajustes.

Ver `docs/ITERATION_BACKLOG.md` para el orden de trabajo.

## Decisiones registradas

- 2026-08-16 — Stack Next.js/TypeScript pese a que la configuración SwarmForge
  del repo menciona Babashka: esa configuración describe las herramientas del
  enjambre (bb.edn raíz ejecuta los tests de los scripts de handoff), y la
  especificación maestra exige una web desplegable en Vercel.
- 2026-08-16 — Formato de precisión con punto decimal ("96.9 %") siguiendo
  los ejemplos literales de la especificación.
