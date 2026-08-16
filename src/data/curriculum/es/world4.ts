import type { Lesson } from "@/domain/curriculum/types";

/**
 * Mundo 4 — Mayúsculas.
 *
 * Introduces Shift ("⇧") as a real technique: hold it with the pinky of
 * the hand OPPOSITE to the letter. Content moves from anchor drills to
 * proper names, places and capitalized sentence starts. No accents or
 * end-of-sentence punctuation yet.
 */
export const WORLD_4: Lesson[] = [
  {
    id: "w4-l1",
    world: 4,
    order: 35,
    title: "La técnica de Shift",
    type: "learn",
    introducedKeys: ["⇧"],
    practicedKeys: ["f", "j", "d", "k", "a", "ñ"],
    xp: 25,
    tip: "Regla de oro: la mayúscula se hace a dos manos. Una pulsa la letra y la CONTRARIA mantiene Shift con el meñique. Así ninguna mano abandona su zona.",
    exercises: [
      { type: "drill", text: "Ff Ff Jj Jj Ff Jj" },
      { type: "drill", text: "Dd Kk Ss Ll Aa Ññ" },
      { type: "drill", text: "Fa Ja Da Ka Sa La" },
      { type: "drill", text: "Aja Faja Kala Daña Sala Jaka" },
      { type: "drill", text: "Jaka Sala Daña Kala Faja Aja La Sa Ka" },
    ],
  },
  {
    id: "w4-l2",
    world: 4,
    order: 36,
    title: "Nombres propios",
    type: "words",
    introducedKeys: [],
    practicedKeys: ["⇧", "a", "e", "l", "m", "s"],
    xp: 30,
    tip: "Los nombres de personas siempre llevan mayúscula inicial. Fíjate: la mano que no escribe la letra es la que sujeta Shift.",
    exercises: [
      { type: "words", text: "Ana Elena Marta Sonia Lucia Paula" },
      { type: "words", text: "Pablo Mario Sergio Andres Tomas Hugo" },
      { type: "words", text: "Ana y Pablo juegan con Marta en la plaza" },
      { type: "words", text: "Elena visita a Sonia y a Lucia cada verano" },
      { type: "words", text: "verano cada Lucia Sonia visita Elena plaza la en" },
    ],
  },
  {
    id: "w4-l3",
    world: 4,
    order: 37,
    title: "Frases que empiezan bien",
    type: "sentences",
    introducedKeys: [],
    practicedKeys: ["⇧", "e", "l", "m", "c", "s"],
    xp: 30,
    tip: "Toda frase empieza con mayúscula. Prepara el meñique contrario un instante antes de la primera letra: ese pequeño anticipo es la clave de la fluidez.",
    exercises: [
      { type: "sentences", text: "El mar es azul y el cielo es claro" },
      { type: "sentences", text: "La luna sale despacio sobre el bosque" },
      { type: "sentences", text: "Mi bicicleta nueva vuela por el camino verde" },
      { type: "sentences", text: "Los gatos duermen al sol en la ventana grande" },
      { type: "sentences", text: "grande ventana la en sol al duermen gatos Los" },
    ],
  },
  {
    id: "w4-l4",
    world: 4,
    order: 38,
    title: "Ciudades y lugares",
    type: "words",
    introducedKeys: [],
    practicedKeys: ["⇧", "s", "g", "t", "c", "v"],
    xp: 30,
    dynamic: "globos",
    tip: "Los lugares también llevan mayúscula. Alterna manos sin prisa: Shift contrario, letra, soltar. El ritmo llega con la repetición.",
    exercises: [
      { type: "words", text: "Madrid Sevilla Granada Toledo Cuenca" },
      { type: "words", text: "Valencia Burgos Salamanca Zamora Soria" },
      { type: "words", text: "El tren sale de Madrid y llega hasta Sevilla" },
      { type: "words", text: "Desde Toledo se ve el rio grande al atardecer" },
      { type: "words", text: "atardecer al grande rio el ve se Toledo Desde" },
    ],
  },
  {
    id: "w4-l5",
    world: 4,
    order: 39,
    title: "Gran repaso de mayúsculas",
    type: "review",
    introducedKeys: [],
    practicedKeys: ["⇧", "a", "e", "m", "l", "b"],
    xp: 35,
    dynamic: "carrera",
    tip: "Lección larga de consolidación. Si notas que miras el teclado en las mayúsculas, frena: mejor lento y a ciegas que rápido mirando.",
    exercises: [
      { type: "sentences", text: "Ana viaja de Granada a Valencia con su hermano Hugo" },
      { type: "sentences", text: "El sol de agosto brilla fuerte sobre Salamanca" },
      { type: "sentences", text: "Marta y Sergio cantan juntos en el coro del pueblo" },
      { type: "sentences", text: "La familia entera cena en el jardin cuando llega el verano" },
      { type: "sentences", text: "Mi abuela Elena cuenta historias del mar cada noche" },
    ],
  },
  {
    id: "w4-l6",
    world: 4,
    order: 40,
    title: "Dominio de las mayúsculas",
    type: "boss",
    introducedKeys: [],
    practicedKeys: ["⇧", "e", "l", "s", "m", "c"],
    xp: 50,
    dynamic: "jefe",
    tip: "Prueba de dominio: mayúsculas fluidas a dos manos, sin mirar y sin perder la fila guía. Tú mandas en el teclado.",
    exercises: [
      { type: "sentences", text: "Lucia y Tomas cruzan Madrid en bicicleta al amanecer" },
      { type: "sentences", text: "El viento del norte llega frio hasta Burgos en enero" },
      { type: "sentences", text: "Pablo escribe una carta larga para su amiga de Sevilla" },
      { type: "sentences", text: "Sevilla de amiga su para larga carta una escribe" },
    ],
  },
];
