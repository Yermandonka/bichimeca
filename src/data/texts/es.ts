/**
 * Banco de textos originales para el modo texto: párrafos naturales en
 * español real, con tildes, mayúsculas y puntuación completa. Se eligen al
 * azar y nunca se copian de fuentes con derechos.
 */

export interface PracticeText {
  id: string;
  title: string;
  text: string;
}

export const TEXTS_ES: PracticeText[] = [
  {
    id: "faro",
    title: "El faro",
    text: "El faro se enciende cuando el sol se esconde detrás del horizonte. Su luz gira despacio, barre las olas y avisa a los barcos que la costa está cerca. Los marineros antiguos decían que un faro es una estrella que alguien plantó en la tierra.",
  },
  {
    id: "biblioteca",
    title: "La biblioteca",
    text: "Una biblioteca guarda miles de vidas posibles. Cada libro es una puerta pequeña: la abres, cruzas el umbral y, durante un rato, piensas con palabras de otra persona. Por eso conviene entrar a menudo, aunque solo sea a mirar.",
  },
  {
    id: "tormenta",
    title: "La tormenta de verano",
    text: "La tormenta de verano llega sin pedir permiso. Primero un viento tibio, después tres gotas gruesas sobre el polvo y, de pronto, el cielo entero cae sobre la calle. Diez minutos más tarde vuelve el sol, como si nada, y todo huele a tierra mojada.",
  },
  {
    id: "desayuno",
    title: "El desayuno",
    text: "Dicen que el desayuno es la comida más importante del día. Puede que sea verdad, o puede que solo sea la más tranquila: pan tostado, zumo frío y unos minutos en los que nadie tiene prisa todavía.",
  },
  {
    id: "mapa",
    title: "Los mapas antiguos",
    text: "En los mapas antiguos, los cartógrafos dibujaban monstruos marinos en las zonas que nadie había explorado. No era miedo: era honestidad. Escribían, a su manera, una frase valiente: aquí termina lo que sabemos.",
  },
  {
    id: "abuela",
    title: "Las recetas de la abuela",
    text: "Mi abuela nunca midió nada en su cocina. Un puñado de arroz, un chorro de aceite, sal hasta que el agua sepa a mar. Sus recetas no caben en un libro porque no eran instrucciones: eran memoria, paciencia y cariño en proporciones exactas.",
  },
  {
    id: "tren",
    title: "El tren nocturno",
    text: "El tren nocturno cruza el país mientras casi todos duermen. Las estaciones pasan iluminadas y vacías, como escenarios esperando su obra. Un viajero despierto mira por la ventana y colecciona, sin querer, pueblos que nunca pisará.",
  },
  {
    id: "otono",
    title: "El otoño",
    text: "El otoño es la estación más sincera. No promete nada: deja caer las hojas, acorta las tardes y enciende los primeros radiadores. A cambio regala una luz dorada que ninguna otra época del año sabe imitar.",
  },
  {
    id: "oficio",
    title: "Un oficio invisible",
    text: "Hay oficios que solo se notan cuando faltan. El afilador, la farera, quien repara relojes de cuerda. Trabajos silenciosos que sostienen pequeñas comodidades: un cuchillo que corta, una costa segura, una hora exacta.",
  },
  {
    id: "gatos",
    title: "La teoría de los gatos",
    text: "Los gatos tienen una teoría sobre los humanos: somos torpes, demasiado grandes y bastante útiles. Por eso nos administran el afecto en dosis pequeñas, para que sigamos abriendo latas con entusiasmo el resto de nuestras vidas.",
  },
  {
    id: "isla",
    title: "La isla",
    text: "Desde la playa, la isla parece a un paso; a nado, queda lejísimos. Con casi todo pasa igual: las distancias cambian según el esfuerzo que exigen. Quizá por eso los sueños se miden mejor en brazadas que en kilómetros.",
  },
  {
    id: "teclado",
    title: "Escribir sin mirar",
    text: "Quien escribe sin mirar el teclado no piensa en letras: piensa en ideas. Los dedos aprenden el camino igual que los pies aprenden la escalera de casa, y un día, sin avisar, las palabras empiezan a llegar solas a la pantalla.",
  },
];
