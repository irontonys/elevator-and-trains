# Objetivo y alcance

## Problema
Minecraft Bedrock no tiene elevadores de edificio ni trenes de metro grandes de forma nativa.
Los rieles y carritos vanilla existen pero son de tamaño pequeño y no sirven para un metro.

## Resultado esperado
- **Elevador:** dos bloques custom iguales (inicio y límite) marcan el rango vertical de un
  elevador. Al pararse sobre el bloque de inicio y saltar, el script escanea hacia arriba, detecta
  los pisos reales (por suelo, no por una altura fija) entre ambos bloques, y sube al jugador un
  piso por cada salto, hasta el piso donde está el bloque de límite.
- **Tren:** un modelo de tren de metro, de al menos ~6 bloques de largo, que corre sobre los
  rieles vanilla ya existentes en el mundo (no coloca rieles nuevos ni requiere una pieza de riel
  propia).
- Ambos se publican como add-on en MCPDL: deben instalarse y desinstalarse sin romper un mundo
  existente.

## Fuera de alcance (por ahora)
- Elevadores horizontales o diagonales.
- Trenes que no sean de metro (vapor, monorriel, etc.) — se puede revisar más adelante.
- Multijugador con varios elevadores/trenes simultáneos no se ha discutido todavía.

## Interesados
- Daniel: autor y quien prueba en iPad/iPhone (no hay Minecraft en la Mac de desarrollo).
