# Spec Delta

## Purpose

Agrega un vagón de metro grande, con estilo inspirado en Metrorrey, que un jugador maneja sobre los
rieles vanilla existentes, con pasajeros sentados adentro.

## ADDED Requirements

### Requirement: Apariencia de vagón de metro
El vagón SHALL medir alrededor de 6 bloques de largo y verse como un vagón de metro: carrocería con
los colores de Metrorrey, ventanas corridas a los lados, puertas de pasajeros, una cabina con
parabrisas al frente y bogies sobre la vía. MUST NOT incluir logos, nombres ni marcas oficiales de
Metrorrey ni de ningún fabricante. Su nombre SHALL mostrarse traducido en español (México) e inglés
(EE. UU.).

#### Scenario: Verlo sobre la vía
- **WHEN** el jugador coloca un vagón sobre un riel recto
- **THEN** ve un vagón de metro de ~6 bloques de largo, centrado sobre la vía y alineado con ella, sin partes invisibles ni texturas faltantes

#### Scenario: Visto desde lejos o de lado
- **WHEN** el jugador ve el vagón desde un extremo o a varios bloques de distancia
- **THEN** el vagón completo se sigue dibujando y no desaparece cuando su centro sale de la pantalla

### Requirement: Conductor y pasajeros adentro
El vagón SHALL tener un asiento de conductor en la cabina y al menos 6 asientos de pasajeros dentro
del vagón. Los jugadores sentados SHALL verse por las ventanas. El primer jugador en subir ocupa el
asiento de conductor; los siguientes, los de pasajeros. Agacharse SHALL bajar al jugador del vagón,
como en vanilla.

#### Scenario: Subir al vagón vacío
- **WHEN** un jugador interactúa con un vagón vacío
- **THEN** queda sentado en la cabina como conductor

#### Scenario: Subir pasajeros
- **WHEN** otros jugadores interactúan con un vagón que ya tiene conductor
- **THEN** quedan sentados adentro, se les ve por las ventanas y no pueden manejar

#### Scenario: Vagón lleno
- **WHEN** todos los asientos están ocupados y otro jugador interactúa con el vagón
- **THEN** no sube

### Requirement: Aparece con un item sobre un riel
El add-on SHALL agregar un item de vagón de metro que se obtiene en creativo y por crafteo. Al usarlo
sobre cualquier riel vanilla, el vagón SHALL aparecer sobre esa vía, alineado con ella y viendo hacia
la dirección del riel más parecida a la que mira el jugador. En supervivencia SHALL gastarse un item.
Si el bloque no es un riel, o no hay suficiente vía conectada para que quepa el vagón, MUST NOT
aparecer y el item no se gasta.

#### Scenario: Colocar sobre un riel recto
- **WHEN** el jugador usa el item sobre un riel con al menos 6 bloques de vía conectada
- **THEN** aparece un vagón alineado con la vía y, en supervivencia, se gasta un item

#### Scenario: Colocar fuera de un riel
- **WHEN** el jugador usa el item sobre un bloque que no es riel
- **THEN** no aparece nada y el item no se gasta

#### Scenario: Vía demasiado corta
- **WHEN** el jugador usa el item sobre un riel suelto o un tramo de 2 bloques
- **THEN** no aparece nada, el item no se gasta y el jugador recibe un aviso de que falta vía

### Requirement: Sigue el trazo de los rieles vanilla
El vagón SHALL moverse solo a lo largo de la vía que forman los rieles vanilla (normal, propulsor,
detector y activador) según la dirección de cada riel, incluidas curvas y pendientes. Todos los tipos
de riel SHALL tratarse igual: el estado de un riel propulsor, detector o activador MUST NOT cambiar la
velocidad. Cada extremo del vagón SHALL seguir la vía por separado, de modo que en una curva el vagón
gira poco a poco en lugar de cambiar de dirección de golpe. Si la vía se acaba o la parte siguiente no
está cargada, el vagón SHALL detenerse en el último punto de la vía.

#### Scenario: Recta
- **WHEN** el vagón avanza por una vía recta
- **THEN** se mantiene centrado sobre la vía y alineado con ella

#### Scenario: Curva
- **WHEN** el vagón pasa por una curva de rieles
- **THEN** su dirección cambia de forma gradual mientras la cruza, con ambos extremos sobre la vía

#### Scenario: Pendiente
- **WHEN** el vagón sube o baja por rieles inclinados
- **THEN** sube o baja con la vía y la carrocería se inclina con la pendiente

#### Scenario: Fin de la vía
- **WHEN** el vagón llega al último riel de una vía
- **THEN** se detiene sin salirse de la vía

#### Scenario: Rieles especiales
- **WHEN** el vagón pasa sobre un riel propulsor apagado o encendido
- **THEN** su velocidad no cambia por el riel

### Requirement: Manejo por el conductor
El conductor SHALL controlar el vagón con el movimiento de su personaje: "adelante" acelera hacia el
frente de la cabina hasta una velocidad máxima, y "atrás" frena y, ya detenido, acelera en reversa
hasta una velocidad máxima menor. Al soltar los controles el vagón SHALL perder velocidad poco a poco.
Sin conductor, el vagón SHALL frenar hasta detenerse y quedarse quieto. Los pasajeros MUST NOT poder
controlarlo. El vagón MUST NOT moverse por empujones de jugadores, mobs, agua o explosiones.

#### Scenario: Acelerar y frenar
- **WHEN** el conductor mantiene "adelante" y luego "atrás"
- **THEN** el vagón acelera hasta su velocidad máxima, luego frena hasta detenerse y después avanza en reversa

#### Scenario: El conductor se baja en movimiento
- **WHEN** el conductor se baja mientras el vagón avanza
- **THEN** el vagón frena hasta detenerse sobre la vía

#### Scenario: Empujones
- **WHEN** un jugador o un mob empuja el vagón detenido
- **THEN** el vagón no se mueve

### Requirement: Quitar el vagón
Un jugador SHALL poder quitar el vagón golpeándolo varias veces en poco tiempo. Al quitarlo, los
jugadores que iban adentro SHALL bajarse sin daño y, si quien lo quitó está en supervivencia, SHALL
recibir el item del vagón. El vagón MUST NOT recibir daño ni destruirse por mobs, fuego, caídas,
explosiones o cualquier otra causa.

#### Scenario: Quitar en supervivencia
- **WHEN** un jugador en supervivencia golpea el vagón las veces necesarias
- **THEN** el vagón desaparece, los pasajeros quedan de pie junto a la vía y el jugador recibe un item de vagón

#### Scenario: Golpe aislado
- **WHEN** un jugador golpea el vagón una vez
- **THEN** el vagón no desaparece

#### Scenario: Explosión cercana
- **WHEN** explota TNT o un creeper junto al vagón
- **THEN** el vagón no se daña ni desaparece

### Requirement: El tren no modifica el mundo
Colocar, manejar o quitar el vagón MUST NOT colocar, quitar ni cambiar ningún riel ni ningún otro
bloque, ni crear scoreboards. El estado del vagón SHALL vivir solo en la propia entidad, de modo que al
quitar el add-on no quede nada más que los rieles que puso el jugador.

#### Scenario: Recorrer una vía
- **WHEN** el vagón recorre una vía de ida y vuelta
- **THEN** los rieles y bloques del recorrido son los mismos que antes

#### Scenario: Quitar el add-on
- **WHEN** se quita el add-on de un mundo con vagones colocados
- **THEN** el mundo carga sin errores, los vagones ya no existen y los rieles siguen en su lugar
