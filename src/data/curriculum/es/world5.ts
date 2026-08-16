import type { Lesson } from "@/domain/curriculum/types";

/**
 * Mundo 5 — Puntuación y frases reales.
 *
 * Comma and period arrive as first-class keys, then their shifted partners
 * (; and :). From here the learner types complete, naturally punctuated
 * Spanish sentences. Accented vowels and opening marks (¿ ¡) wait for a
 * future world with dead-key training.
 */
export const WORLD_5: Lesson[] = [
  {
    id: "w5-l1",
    world: 5,
    order: 41,
    title: "La coma y el punto",
    type: "learn",
    introducedKeys: [",", "."],
    practicedKeys: [",", ".", "m", "n", "k", "l"],
    xp: 25,
    tip: "La coma es del corazón derecho y el punto del anular derecho, justo bajo K y L. Baja el dedo en diagonal y vuelve: son teclas de visita rápida.",
    exercises: [
      { type: "drill", text: "k, k, l. l. k, l." },
      { type: "drill", text: "m, n. m, n. si, no." },
      { type: "words", text: "sal, pan, sol. mar, luz, flor." },
      { type: "sentences", text: "Hoy toca pan, queso y fruta." },
    ],
  },
  {
    id: "w5-l2",
    world: 5,
    order: 42,
    title: "Frases con pausa",
    type: "sentences",
    introducedKeys: [],
    practicedKeys: [",", ".", "⇧", "e", "l", "s"],
    xp: 30,
    tip: "La coma es una pausa breve y el punto, un final. Escribe la frase entera de un tirón y deja que la puntuación marque el ritmo, como al leer en voz alta.",
    exercises: [
      { type: "sentences", text: "El tren llega tarde. Ana espera con calma." },
      { type: "sentences", text: "Compramos fruta, pan y leche en el mercado." },
      { type: "sentences", text: "Llueve fuera. Dentro, la casa huele a sopa caliente." },
      { type: "sentences", text: "Primero estudia, luego juega. Ese es el trato." },
    ],
  },
  {
    id: "w5-l3",
    world: 5,
    order: 43,
    title: "Punto y coma, dos puntos",
    type: "learn",
    introducedKeys: [";", ":"],
    practicedKeys: [";", ":", ",", ".", "⇧"],
    xp: 25,
    tip: "El ; y los : viven en las mismas teclas que la coma y el punto, pero con Shift. La técnica ya la conoces: meñique contrario y el dedo de siempre.",
    exercises: [
      { type: "drill", text: "k; l: k; l: si; no:" },
      { type: "sentences", text: "La lista es corta: pan, queso y miel." },
      { type: "sentences", text: "Llueve mucho; mejor salimos luego." },
      { type: "sentences", text: "Trae esto: agua, fruta y un mapa." },
    ],
  },
  {
    id: "w5-l4",
    world: 5,
    order: 44,
    title: "Párrafos con sentido",
    type: "sentences",
    introducedKeys: [],
    practicedKeys: [",", ".", ";", ":", "⇧"],
    xp: 40,
    tip: "Lección larga: párrafos completos de verdad. Lee la frase entera, respira y escribe con ritmo constante. La vista en la pantalla, siempre.",
    exercises: [
      {
        type: "sentences",
        text: "El verano empieza despacio. Las tardes se alargan, la calle se llena de voces y nadie tiene prisa.",
      },
      {
        type: "sentences",
        text: "Mi plan es sencillo: desayunar bien, pasear junto al rio y leer un rato bajo la sombra fresca.",
      },
      {
        type: "sentences",
        text: "La tormenta llega de golpe; los cristales tiemblan, el cielo se apaga y el mundo entero espera.",
      },
    ],
  },
  {
    id: "w5-l5",
    world: 5,
    order: 45,
    title: "Reto de precisión total",
    type: "accuracy",
    introducedKeys: [],
    practicedKeys: [",", ".", ";", ":", "⇧"],
    xp: 35,
    tip: "Objetivo: cero errores en frases reales. La puntuación castiga las prisas; la calma la domina. Ve al ritmo que necesites.",
    exercises: [
      { type: "sentences", text: "Zoe guarda tres cosas: valor, calma y humor." },
      { type: "sentences", text: "El buzo baja despacio; el mar, oscuro, le abraza." },
      { type: "sentences", text: "Queda poco, muy poco. La meta ya se ve." },
    ],
  },
  {
    id: "w5-l6",
    world: 5,
    order: 46,
    title: "Fluidez de escritor",
    type: "sentences",
    introducedKeys: [],
    practicedKeys: [",", ".", ";", ":", "⇧"],
    xp: 40,
    tip: "Última lección larga: texto corrido como el de un libro. Ya no piensas en teclas, piensas en palabras. Eso es mecanografiar de verdad.",
    exercises: [
      {
        type: "sentences",
        text: "Cada mañana, el pueblo despierta igual: el panadero enciende el horno, el quiosco abre sus puertas y los perros pasean solos hasta la fuente.",
      },
      {
        type: "sentences",
        text: "Escribir sin mirar el teclado cambia las cosas; las ideas llegan a la pantalla enteras, sin frenos, casi al ritmo del pensamiento.",
      },
      {
        type: "sentences",
        text: "La bruja del cuento no era mala. Guardaba semillas raras, curaba zorros heridos y sabia el nombre secreto de cada estrella.",
      },
    ],
  },
  {
    id: "w5-l7",
    world: 5,
    order: 47,
    title: "Repaso general",
    type: "review",
    introducedKeys: [],
    practicedKeys: [",", ".", ";", ":", "⇧"],
    xp: 35,
    tip: "Repaso de todo el curso hasta hoy: letras, mayúsculas y puntuación. Lo que repasas hoy no se olvida mañana.",
    exercises: [
      { type: "sentences", text: "Ana, Pablo y Elena viajan juntos a Granada en tren." },
      { type: "sentences", text: "El examen tiene tres partes: letras, palabras y frases." },
      { type: "sentences", text: "Quince estrellas brillan; la noche es un mapa gigante." },
      { type: "sentences", text: "Mi vecina canta bajito, riega sus flores y saluda al cartero." },
    ],
  },
  {
    id: "w5-l8",
    world: 5,
    order: 48,
    title: "Dominio de la escritura real",
    type: "boss",
    introducedKeys: [],
    practicedKeys: [",", ".", ";", ":", "⇧"],
    xp: 60,
    tip: "La gran prueba final de esta etapa: frases largas, mayúsculas y puntuación, todo junto. Precisión primero; la velocidad ya vive en tus dedos.",
    exercises: [
      {
        type: "sentences",
        text: "El faro se enciende al anochecer y su luz barre el mar en circulos lentos, pacientes, exactos.",
      },
      {
        type: "sentences",
        text: "Hay tres reglas en esta casa: llegar a tiempo, escuchar de verdad y reir todos los dias un poco.",
      },
      {
        type: "sentences",
        text: "Zoe cierra el cuaderno, apaga la lampara y sonrie; hoy ha escrito su primera pagina sin mirar el teclado.",
      },
    ],
  },
];
