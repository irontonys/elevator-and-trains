# metro-train Specification

## Purpose
Agrega un vagón de metro grande, con estilo inspirado en Metrorrey, que un jugador maneja sobre los
rieles vanilla existentes, con pasajeros sentados adentro.

## Requirements

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
detector y activador) según la dirección de cada riel, incluidas curvas y pendientes. Los rieles
detector y activador SHALL tratarse como rieles normales; los propulsores siguen la vía igual que los
demás y además cambian la velocidad (ver "Rieles propulsores"). Cada extremo del vagón SHALL seguir la
vía por separado, de modo que en una curva el vagón gira poco a poco en lugar de cambiar de dirección
de golpe. En las pendientes la carrocería SHALL inclinarse con la vía, tanto de subida como de bajada,
y la inclinación MUST NOT producir errores ni warnings en el Content Log.
Si la vía se acaba o la parte siguiente no está cargada, el vagón SHALL detenerse en el último punto de
la vía.

#### Scenario: Recta
- **WHEN** el vagón avanza por una vía recta
- **THEN** se mantiene centrado sobre la vía y alineado con ella

#### Scenario: Curva
- **WHEN** el vagón pasa por una curva de rieles
- **THEN** su dirección cambia de forma gradual mientras la cruza, con ambos extremos sobre la vía

#### Scenario: Pendiente
- **WHEN** el vagón sube por rieles inclinados
- **THEN** sube con la vía y la carrocería se inclina con el frente hacia arriba

#### Scenario: Bajada
- **WHEN** el vagón baja por rieles inclinados
- **THEN** baja con la vía y la carrocería se inclina con el frente hacia abajo

#### Scenario: Log limpio en movimiento
- **WHEN** un tren recorre una vía con rectas, curvas y pendientes
- **THEN** el Content Log no muestra errores ni warnings del add-on

#### Scenario: Fin de la vía
- **WHEN** el vagón llega al último riel de una vía
- **THEN** se detiene sin salirse de la vía

#### Scenario: Rieles especiales
- **WHEN** el vagón pasa sobre un riel detector o activador
- **THEN** su velocidad no cambia por el riel

### Requirement: Manejo por el conductor
El conductor SHALL controlar el tren con el movimiento de su personaje: "adelante" acelera hacia el
frente de la cabina hasta 12 bloques por segundo, y "atrás" frena y, ya detenido, acelera en reversa
hasta una velocidad máxima menor. Al soltar los controles el tren SHALL perder velocidad poco a poco.
Por encima de 12 bloques por segundo (después de un tramo de propulsores) el tren SHALL ir perdiendo
velocidad poco a poco aunque el conductor mantenga "adelante". Sin conductor, el tren SHALL frenar
hasta detenerse y quedarse quieto, salvo sobre propulsores encendidos. Los pasajeros MUST NOT poder
controlarlo. El tren MUST NOT moverse por empujones de jugadores, mobs, agua o explosiones.

#### Scenario: Acelerar y frenar
- **WHEN** el conductor mantiene "adelante" y luego "atrás"
- **THEN** el tren acelera hasta 12 bloques por segundo, luego frena hasta detenerse y después avanza en reversa

#### Scenario: Más rápido que un carrito
- **WHEN** un carrito vanilla y el metro recorren la misma vía recta sin propulsores, el metro con "adelante" sostenido
- **THEN** el metro llega a una velocidad mayor que la del carrito

#### Scenario: El conductor se baja en movimiento
- **WHEN** el conductor se baja mientras el tren avanza fuera de propulsores
- **THEN** el tren frena hasta detenerse sobre la vía

#### Scenario: Empujones
- **WHEN** un jugador o un mob empuja el tren detenido
- **THEN** el tren no se mueve

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

### Requirement: Rieles propulsores
Mientras el centro de un vagón del tren esté sobre un riel propulsor **encendido**, el tren SHALL
acelerar solo, sin que el conductor haga nada, en el sentido en el que se mueve (o hacia el frente si
estaba detenido), hasta 20 bloques por segundo. Mientras esté sobre un riel propulsor **apagado**, el
tren SHALL frenar hasta detenerse, aunque el conductor mantenga "adelante". Una vez detenido sobre un
propulsor apagado, el conductor SHALL poder arrancar de nuevo con "adelante" o "atrás" y salir de ese
tramo.

#### Scenario: Tramo de propulsores encendidos
- **WHEN** el tren entra a un tramo de propulsores encendidos sin que el conductor toque los controles
- **THEN** acelera solo hasta 20 bloques por segundo y, al salir del tramo, va perdiendo velocidad poco a poco

#### Scenario: Estación con propulsor apagado
- **WHEN** el tren llega a un riel propulsor apagado con el conductor manteniendo "adelante"
- **THEN** frena hasta detenerse

#### Scenario: Salir de la estación
- **WHEN** el tren está detenido sobre un propulsor apagado y el conductor presiona "adelante"
- **THEN** el tren arranca y sale del tramo apagado sin volver a frenarse ahí

#### Scenario: Arranque con propulsor encendido
- **WHEN** el tren está detenido y se enciende el propulsor que tiene debajo
- **THEN** el tren arranca solo hacia el frente

### Requirement: Vagones unidos
Dos vagones sobre la misma vía SHALL engancharse solos cuando sus extremos quedan juntos, ya sea porque
el jugador coloca uno pegado al otro o porque chocan al moverse. Un tren SHALL tener como máximo 4
vagones. Los vagones enganchados SHALL moverse juntos como un solo tren: cada vagón sigue la vía por su
cuenta a una distancia fija de los demás, medida sobre la vía, y todos tienen la misma velocidad.
Maneja solo el conductor del vagón de adelante (en el sentido de avance); en los demás vagones todos
son pasajeros. Si cualquier vagón del tren llega al fin de la vía, todo el tren se detiene. Al
interactuar agachado con un vagón, el jugador SHALL desengancharlo del vagón de adelante y el tren se
parte en dos. Al quitar un vagón a golpes, los vagones que quedan de cada lado SHALL seguir como trenes
separados. El enganche SHALL conservarse al guardar y volver a abrir el mundo, sin guardar nada fuera
de los propios vagones.

#### Scenario: Colocar un vagón pegado a otro
- **WHEN** el jugador coloca un vagón en la misma vía, justo detrás de otro
- **THEN** los dos quedan enganchados y se mueven juntos cuando el conductor avanza

#### Scenario: Chocar dos vagones
- **WHEN** un tren en movimiento alcanza a otro vagón detenido en la misma vía
- **THEN** se detiene al tocarlo y quedan enganchados

#### Scenario: Tren en una curva
- **WHEN** un tren de 3 vagones pasa por una curva
- **THEN** cada vagón gira poco a poco sobre la vía y la distancia entre vagones se mantiene

#### Scenario: Límite de vagones
- **WHEN** el jugador intenta enganchar un quinto vagón a un tren de 4
- **THEN** el quinto vagón no se engancha y queda como un tren aparte

#### Scenario: Desenganchar
- **WHEN** el jugador interactúa agachado con el segundo vagón de un tren de 3
- **THEN** el primer vagón queda como un tren y el segundo y el tercero como otro

#### Scenario: Guardar y volver a abrir
- **WHEN** se cierra y se vuelve a abrir el mundo con un tren de 3 vagones
- **THEN** los 3 vagones siguen enganchados y se mueven juntos

### Requirement: Sonido sobre la vía
Mientras el tren avanza, cada vagón SHALL sonar como un carrito vanilla sobre la vía (`minecart.base`),
más fuerte a mayor velocidad. El vagón MUST NOT hacer sonidos de pasos al moverse. Detenido, el tren
MUST NOT hacer el sonido de rieles.

#### Scenario: Tren en movimiento
- **WHEN** el conductor avanza con el tren
- **THEN** se escucha el sonido de un carrito sobre la vía y no se escuchan pasos

#### Scenario: Más velocidad
- **WHEN** el tren pasa de ir despacio a ir sobre propulsores encendidos
- **THEN** el sonido de rieles se escucha más fuerte y un poco más agudo

#### Scenario: Tren detenido
- **WHEN** el tren se detiene en una estación
- **THEN** deja de escucharse el sonido de rieles
