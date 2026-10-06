# elevator Specification

## Purpose
Permite construir elevadores de edificio con dos bloques custom (inicio abajo y límite arriba) en la
misma columna, y moverse entre los pisos reales que haya entre ellos saltando para subir y
agachándose para bajar.

## Requirements

### Requirement: Bloque de elevador
El add-on SHALL agregar un bloque `eleytren:elevator_block` que el jugador puede obtener en creativo
y por crafteo en supervivencia, colocar y romper como cualquier bloque sólido. Su nombre SHALL
mostrarse traducido en español (México) e inglés (EE. UU.). El mismo bloque sirve como bloque de
inicio y como bloque de límite.

#### Scenario: Obtener el bloque en creativo
- **WHEN** el jugador busca el bloque de elevador en el inventario de creativo
- **THEN** lo encuentra con su nombre traducido (no una clave sin resolver) y con textura

#### Scenario: Craftear en supervivencia
- **WHEN** el jugador tiene en la mesa de crafteo los ingredientes de la receta del bloque
- **THEN** obtiene bloques de elevador

#### Scenario: Romper el bloque
- **WHEN** el jugador rompe un bloque de elevador en supervivencia con la mano o con un pico
- **THEN** el bloque se rompe y suelta un bloque de elevador

### Requirement: Definición de un elevador
Un elevador SHALL existir entre dos bloques de elevador que están en la misma columna (misma X y Z):
el de abajo es el **inicio** y el de arriba es el **límite**. No hace falta configurar nada más.
Si una columna tiene más de dos bloques de elevador, cada par consecutivo SHALL formar un tramo y el
jugador SHALL poder pasar de un tramo al siguiente porque el bloque intermedio cuenta como piso de
ambos. Un bloque de elevador sin otro en su columna MUST NOT mover al jugador.

#### Scenario: Elevador con dos bloques
- **WHEN** hay un bloque de elevador en Y=64 y otro en Y=80 en la misma columna
- **THEN** los pisos que se detecten en esa columna entre Y=64 e Y=80, incluidos ambos bloques, forman un elevador

#### Scenario: Bloque suelto
- **WHEN** el jugador salta o se agacha sobre un bloque de elevador que no tiene otro arriba ni abajo en su columna
- **THEN** no se mueve y el juego se comporta como con cualquier bloque

#### Scenario: Tres bloques en la columna
- **WHEN** hay bloques de elevador en Y=64, Y=80 y Y=96 en la misma columna y el jugador está parado en el de Y=80
- **THEN** saltar lo lleva al siguiente piso hacia Y=96 y agacharse lo lleva al piso anterior hacia Y=64

### Requirement: Detección de pisos por suelo real
Un piso SHALL ser cualquier bloque de la columna del elevador que no sea aire ni líquido y que tenga
encima dos bloques de aire, para que el jugador quepa de pie. Las alfombras, los carteles (de pie, de
pared y colgantes) y las antorchas de cualquier tipo SHALL contar como aire: MUST NOT contar como piso
ni tapar el espacio para la cabeza. Los pisos SHALL detectarse a partir de los bloques que hay en el
mundo al momento de moverse, sin usar una altura fija ni una lista guardada. Los bloques de inicio y de
límite cuentan como piso si cumplen esa condición.

#### Scenario: Pisos con alturas distintas
- **WHEN** entre el inicio (Y=64) y el límite (Y=90) la columna tiene suelo en Y=69 y en Y=81, con dos bloques de aire encima de cada uno
- **THEN** los pisos del elevador son Y=64, Y=69, Y=81 e Y=90, en ese orden

#### Scenario: Suelo sin espacio para el jugador
- **WHEN** hay un bloque sólido en la columna con solo un bloque de aire encima
- **THEN** ese bloque no cuenta como piso y el elevador lo salta

#### Scenario: El edificio cambia
- **WHEN** el jugador agrega o quita suelo en la columna del elevador
- **THEN** el siguiente movimiento usa los pisos que hay en ese momento

#### Scenario: Alfombra sobre un piso
- **WHEN** un piso de la columna tiene una alfombra encima
- **THEN** el piso sigue contando y la alfombra no se cuenta como otro piso

#### Scenario: Antorcha o cartel en la columna
- **WHEN** hay una antorcha o un cartel de pared en el espacio de la cabeza de un piso, o un cartel colgante en la columna
- **THEN** el piso sigue contando y la antorcha o el cartel no se cuentan como piso

### Requirement: Subir un piso por salto
Cuando un jugador parado sobre un piso de un elevador presiona saltar, el add-on SHALL llevarlo al
siguiente piso de arriba, sin pasar del bloque límite. Cada vez que presiona saltar SHALL subir
exactamente un piso; mantener presionado el botón MUST NOT subir más de un piso. Si ya está en el
límite, MUST NOT moverse.

#### Scenario: Subir desde el inicio
- **WHEN** el jugador está parado en el bloque de inicio y presiona saltar una vez
- **THEN** aparece de pie sobre el siguiente piso de arriba, centrado en la columna y mirando hacia donde miraba

#### Scenario: Mantener el salto presionado
- **WHEN** el jugador mantiene presionado saltar varios segundos sobre un piso del elevador
- **THEN** sube un solo piso

#### Scenario: Ya en el límite
- **WHEN** el jugador está parado en el bloque límite y presiona saltar
- **THEN** salta normal y no se mueve a otro piso

### Requirement: Bajar un piso al agacharse
Cuando un jugador parado sobre un piso de un elevador empieza a agacharse, el add-on SHALL llevarlo al
piso de abajo más cercano, sin pasar del bloque de inicio. Cada vez que empieza a agacharse SHALL
bajar exactamente un piso; quedarse agachado MUST NOT bajar más pisos. Si ya está en el inicio, MUST
NOT moverse.

#### Scenario: Bajar desde el límite
- **WHEN** el jugador está parado en el bloque límite y se agacha una vez
- **THEN** aparece de pie sobre el piso de abajo más cercano, centrado en la columna

#### Scenario: Quedarse agachado
- **WHEN** el jugador se agacha y se queda agachado varios segundos sobre un piso del elevador
- **THEN** baja un solo piso

#### Scenario: Ya en el inicio
- **WHEN** el jugador está parado en el bloque de inicio y se agacha
- **THEN** se agacha normal y no se mueve a otro piso

### Requirement: Solo dentro del elevador
El elevador SHALL activarse solo si el jugador está en el suelo y el bloque sobre el que está parado
es un piso de un elevador en su columna. En cualquier otro lugar, saltar y agacharse MUST funcionar
como en vanilla.

#### Scenario: Fuera del elevador
- **WHEN** el jugador salta o se agacha en un lugar cuya columna no tiene bloques de elevador arriba y abajo
- **THEN** no pasa nada fuera de lo normal

#### Scenario: En el aire
- **WHEN** el jugador está cayendo o nadando dentro de la columna de un elevador y se agacha
- **THEN** no se mueve a otro piso

### Requirement: Varios jugadores
Cada jugador SHALL usar los elevadores de forma independiente: el movimiento de uno no afecta a otro,
aunque estén en el mismo elevador.

#### Scenario: Dos jugadores en el mismo elevador
- **WHEN** dos jugadores están en pisos distintos del mismo elevador y uno salta
- **THEN** solo ese jugador sube; el otro se queda donde estaba

### Requirement: El elevador no modifica el mundo
Usar el elevador MUST NOT colocar, quitar ni cambiar ningún bloque, ni crear scoreboards o entidades.
Solo mueve al jugador.

#### Scenario: Después de usarlo
- **WHEN** un jugador sube y baja varias veces por un elevador
- **THEN** los bloques del edificio y de la columna son los mismos que antes

### Requirement: Indicador de piso
Al llegar a un piso con el elevador, y mientras siga parado en ese piso, el jugador SHALL ver el piso
actual en la action bar. MUST NOT mostrarse ningún título ni aviso en el centro de la pantalla. Los
pisos SHALL numerarse desde el bloque de elevador más bajo de la columna: ese piso es la **Planta baja
(PB)**, el más alto es el **PH** y los de en medio son 1, 2, 3… en orden. El indicador MUST NOT guardar
nada en el mundo, y cuando nadie está usando un elevador MUST NOT hacer ningún trabajo periódico.

#### Scenario: Llegar a un piso
- **WHEN** el jugador sube de la planta baja al siguiente piso de un elevador con 5 pisos arriba de la planta baja
- **THEN** ve "Piso 1 / 5" en la action bar y nada en el centro de la pantalla

#### Scenario: Llegar a la planta baja
- **WHEN** el jugador baja hasta el bloque de inicio más bajo de la columna
- **THEN** ve "PB / 5" en la action bar

#### Scenario: Llegar al último piso
- **WHEN** el jugador llega al piso más alto de la cadena de elevadores
- **THEN** ve "PH / 5" en la action bar

#### Scenario: Salir del elevador
- **WHEN** el jugador se baja de la columna del elevador o se aleja del piso al que llegó
- **THEN** la action bar deja de mostrar el piso en menos de un segundo

#### Scenario: Nadie usa el elevador
- **WHEN** ningún jugador ha usado un elevador o todos ya se salieron
- **THEN** el add-on no corre ninguna revisión periódica del indicador

#### Scenario: Idioma
- **WHEN** el juego está en inglés
- **THEN** el indicador se muestra en inglés ("Floor 1 / 5", "G / 5", "PH / 5")
