# Bichimeca — Modelo pedagógico

## Principios

1. **Precisión antes que velocidad.** En fases iniciales la precisión pesa
   mucho más que la PPM; los objetivos de velocidad solo ganan peso cuando la
   precisión se estabiliza (~≥95 %).
2. **Andamiaje.** Se introducen 1–2 teclas nuevas por lección, empezando por
   las anclas F y J de la fila guía.
3. **Aprendizaje por maestría.** Las puertas de avance exigen competencia
   demostrada (aprox.: aprobado ≥94–95 % de precisión, maestría ≥97 %,
   confirmada en más de un intento). Umbrales configurables, no dispersos
   por el código.
4. **Feedback inmediato y no punitivo.** El error se marca al instante; el
   fallo produce "Vamos a reforzar estas teclas", nunca "Has perdido".
5. **Práctica deliberada y espaciada.** Sesiones útiles de 5–15 min; las
   debilidades reciben práctica extra mezclada con material dominado y
   reciente (nunca monotonía de solo teclas débiles).
6. **Interleaving y repaso.** Las teclas dominadas siguen apareciendo; el
   material antiguo vuelve periódicamente.
7. **Transferencia.** Patrones → combinaciones → palabras reales → frases →
   texto natural en español, tan pronto como el conjunto de teclas lo permite.
8. **Motivación por competencia.** Las recompensas (XP, estrellas, rachas)
   premian mejora real, no repetición sin sentido.

## Modelo de debilidad (diseño)

Puntuación interna por tecla/bigrama que combina tasa de error, latencia de
respuesta, recencia, errores repetidos, frecuencia en español y **tamaño de
muestra**: 1 error en 2 intentos no convierte una tecla en "tu peor tecla";
el lenguaje mostrado refleja la incertidumbre ("Todavía necesitamos practicar
más la Z").

## Métricas al servicio del aprendizaje

Las estadísticas existen para responder: ¿Estoy mejorando? ¿Qué hago bien y
mal? ¿Qué practico ahora? La habilidad actual se estima con métricas móviles
recientes (no medias de por vida); el historial completo se conserva para
visualizar el progreso desde la línea base del primer día.
