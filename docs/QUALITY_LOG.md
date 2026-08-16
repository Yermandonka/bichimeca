# Registro de calidad

Auditorías y decisiones importantes, en orden cronológico inverso.

## 2026-08-16 — Línea base inicial

- Repo previo: solo infraestructura SwarmForge; sin código de aplicación.
- Andamiaje creado a mano (el directorio no estaba vacío para create-next-app).
- Puertas verificadas en local: `npm run lint`, `npm run typecheck`,
  `npm run test`, `npm run build` (ver commit).
- Cabeceras de seguridad básicas en `next.config.ts`; sin dependencias más
  allá del stack base; sin peticiones externas en runtime.
- Regla permanente: la pérdida de progreso de la aprendiz es un bug P0; toda
  migración de esquema llevará tests antes de publicarse.
