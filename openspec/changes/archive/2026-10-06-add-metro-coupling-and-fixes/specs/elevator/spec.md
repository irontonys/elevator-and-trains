# Spec Delta

## MODIFIED Requirements

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
