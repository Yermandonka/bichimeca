/**
 * Banco de textos originales para el modo texto: párrafos largos y
 * naturales en español real, con tildes, mayúsculas y puntuación completa.
 * Se eligen al azar y nunca se copian de fuentes con derechos.
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
    text: "El faro se enciende cuando el sol se esconde detrás del horizonte. Su luz gira despacio, barre las olas una a una y avisa a los barcos de que la costa está cerca. Los marineros antiguos decían que un faro es una estrella que alguien plantó en la tierra, y puede que tuvieran razón: las estrellas también sirven para orientarse, también trabajan de noche y también parecen apagarse cuando llega la mañana. El farero, mientras tanto, sube los ciento doce escalones con su termo de café, revisa la lámpara y apunta en su cuaderno la misma frase de cada día: todo en orden, mar tranquila.",
  },
  {
    id: "biblioteca",
    title: "La biblioteca",
    text: "Una biblioteca guarda miles de vidas posibles. Cada libro es una puerta pequeña: la abres, cruzas el umbral y, durante un rato, piensas con palabras de otra persona. Hay puertas que llevan a selvas húmedas, a naves espaciales, a cocinas donde siempre es domingo. Hay puertas diminutas que solo se abren una vez y puertas gigantes que se quedan abiertas para siempre. La bibliotecaria conoce casi todas, aunque jamás lo presume; se limita a observar qué clase de silencio traes hoy y, sin preguntar nada, te deja sobre la mesa exactamente la puerta que necesitabas cruzar.",
  },
  {
    id: "tormenta",
    title: "La tormenta de verano",
    text: "La tormenta de verano llega sin pedir permiso. Primero sopla un viento tibio que hace bailar los toldos, después caen tres gotas gruesas sobre el polvo del camino y, de pronto, el cielo entero se derrumba sobre la calle. Los vecinos corren, las persianas aplauden, un perro valiente ladra a los truenos como si pudiera negociar con ellos. Diez minutos más tarde vuelve el sol, como si nada hubiera pasado, y todo huele a tierra mojada. Los charcos, recién estrenados, se convierten en espejos donde las golondrinas se miran antes de volver a coser el cielo con sus vuelos.",
  },
  {
    id: "desayuno",
    title: "El desayuno",
    text: "Dicen que el desayuno es la comida más importante del día. Puede que sea verdad, o puede que solo sea la más tranquila: pan tostado, zumo frío y unos minutos en los que nadie tiene prisa todavía. La casa huele a café aunque no todos lo beban, la radio cuenta noticias que aún no pesan y la mesa reúne, medio dormidos, a los mismos de siempre. Hay quien repasa sus planes, quien mira por la ventana y quien unta mantequilla con una concentración de relojero. Luego el día arranca, claro, con sus carreras y sus ruidos; pero esos primeros minutos lentos ya nadie se los quita a nadie.",
  },
  {
    id: "mapa",
    title: "Los mapas antiguos",
    text: "En los mapas antiguos, los cartógrafos dibujaban monstruos marinos en las zonas que nadie había explorado todavía. No era miedo, ni superstición, ni ganas de adornar: era honestidad. Escribían, a su manera, una frase valiente: aquí termina lo que sabemos. Siglos después seguimos haciendo mapas, aunque ya no dejemos sitio para serpientes gigantes ni pulpos furiosos. Es una lástima, porque aquellos monstruos cumplían una función noble: recordar al navegante que el mundo es más grande que su barco, y que toda frontera del conocimiento es, en el fondo, una invitación a cruzarla.",
  },
  {
    id: "abuela",
    title: "Las recetas de la abuela",
    text: "Mi abuela nunca midió nada en su cocina. Un puñado de arroz, un chorro de aceite, sal hasta que el agua sepa a mar y fuego lento hasta que la casa entera pregunte qué hay de comer. Sus recetas no caben en un libro porque no eran instrucciones: eran memoria, paciencia y cariño en proporciones exactas que solo sus manos conocían. Una vez intenté apuntar la receta del guiso de los domingos y me dictó, muy seria, tres ingredientes y un consejo: no tengas prisa. Sigo sin saber cuánto es un puñado, pero cada vez que cocino despacio, la cocina huele un poco a ella.",
  },
  {
    id: "tren",
    title: "El tren nocturno",
    text: "El tren nocturno cruza el país mientras casi todos duermen. Las estaciones pasan iluminadas y vacías, como escenarios esperando su obra, y los pueblos son apenas un puñado de luces amarillas flotando en la oscuridad. Un viajero despierto apoya la frente en la ventana y colecciona, sin querer, lugares que nunca pisará: un andén con bicicletas dormidas, una fábrica que respira vapor, un campo de girasoles que de noche miran todos al suelo. Al amanecer, el tren llega a su destino con las historias de medio país pegadas a los cristales, y nadie, ni siquiera el revisor, se da cuenta.",
  },
  {
    id: "otono",
    title: "El otoño",
    text: "El otoño es la estación más sincera. No promete nada: deja caer las hojas, acorta las tardes y enciende los primeros radiadores sin pedir disculpas. A cambio regala una luz dorada que ninguna otra época del año sabe imitar, una luz baja y amable que convierte cualquier calle corriente en una fotografía. Vuelven los abrigos con entradas de cine olvidadas en los bolsillos, vuelven las castañas y su humo dulce, vuelve el placer serio de leer mientras llueve. Quien dice que el otoño es triste no ha pisado nunca un parque en octubre, con el suelo crujiendo como pan recién hecho.",
  },
  {
    id: "oficio",
    title: "Un oficio invisible",
    text: "Hay oficios que solo se notan cuando faltan. El afilador que pasaba silbando con su bicicleta, la farera que vigilaba la costa, quien repara relojes de cuerda en un taller del tamaño de un armario. Trabajos silenciosos que sostienen pequeñas comodidades: un cuchillo que corta como el primer día, una costa segura en plena tormenta, una hora exacta latiendo en la muñeca. El mundo presume de sus inventos enormes, de sus cohetes y sus máquinas brillantes, pero funciona gracias a esta gente menuda y constante que hace bien, cada día, cosas que casi nadie ve.",
  },
  {
    id: "gatos",
    title: "La teoría de los gatos",
    text: "Los gatos tienen una teoría sobre los humanos: somos torpes, demasiado grandes y bastante útiles. Por eso nos administran el afecto en dosis pequeñas y calculadas, para que sigamos abriendo latas con entusiasmo el resto de nuestras vidas. Un gato jamás corre hacia la puerta cuando llegas; espera, bosteza, se estira con teatralidad y, cuando por fin se acerca, lo hace con el aire de quien concede una audiencia. Y sin embargo, a las tres de la madrugada, ese mismo emperador diminuto vendrá a dormirse sobre tus pies, y tú, súbdito fiel, no te atreverás a moverte hasta el amanecer.",
  },
  {
    id: "isla",
    title: "La isla",
    text: "Desde la playa, la isla parece estar a un paso; a nado, queda lejísimos. Con casi todo pasa igual: las distancias cambian según el esfuerzo que exigen, y no hay mapa que mida eso. Los del pueblo cuentan que hace años un chico cruzó hasta la isla un quince de agosto, brazada a brazada, y volvió al atardecer con una piedra blanca como prueba. La piedra sigue en el bar, encima de la nevera de los helados, y cada verano alguien la mira, mira la isla y hace cuentas en silencio. Quizá por eso los sueños se miden mejor en brazadas que en kilómetros: importa menos lo lejos que están que las ganas de mojarse.",
  },
  {
    id: "teclado",
    title: "Escribir sin mirar",
    text: "Quien escribe sin mirar el teclado no piensa en letras: piensa en ideas. Los dedos aprenden el camino igual que los pies aprenden la escalera de casa, a base de repetirla hasta que la oscuridad deja de importar. Al principio cuesta, claro; las manos dudan, la mirada hace trampas y cada tilde parece una emboscada. Pero un día cualquiera, sin avisar, las palabras empiezan a llegar solas a la pantalla, enteras y en orden, casi al ritmo del pensamiento. Ese día entiendes que no has aprendido a teclear: has aprendido a escuchar lo que piensas con las yemas de los dedos.",
  },
];
