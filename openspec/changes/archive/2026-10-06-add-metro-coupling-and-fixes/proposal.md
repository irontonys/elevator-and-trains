# Proposal

## Why

Primera ronda de retroalimentación de Daniel con el build 0.2.0 en el iPad:
- El aviso grande del elevador tapa la pantalla.
- Las alfombras, los carteles y las antorchas en la columna estorban como si fueran pisos.
- Al último piso le falta el nombre que se usa en los edificios reales.
- En el metro, los rieles propulsores no hacen nada y el vagón nunca se inclina.
- Daniel quiere unir varios metros para formar un tren y que el metro vaya más rápido que un carrito
  vanilla sin gastar más ticks.

Depende de `add-skeleton-and-elevator` y `add-metro-train`: esos dos se archivan antes que este, para
que existan las specs `elevator` y `metro-train` que aquí se modifican.

## What Changes

**Elevador**
- Se quita el título grande al llegar a un piso. Solo queda el indicador en la action bar.
- El último piso se llama **PH** (como en los tableros de elevador en México y EE. UU.). Los demás
  siguen siendo PB, 1, 2, 3…
- Las alfombras, los carteles (de pie, de pared y colgantes) y las antorchas (de todos los tipos)
  cuentan como aire: no son piso ni tapan el espacio para la cabeza.

**Metro**
- **Rieles propulsores encendidos:** aceleran el tren solos hasta una velocidad mayor que la máxima del
  conductor. El conductor solo tiene que avanzar en los tramos sin propulsores.
- **Rieles propulsores apagados:** frenan el tren hasta detenerlo, como en vanilla, para hacer
  estaciones. Ya detenido, el conductor puede arrancar de nuevo.
- **Más velocidad:** la máxima del conductor sube a 12 bloques/s y con propulsores llega a 20 bloques/s
  (el carrito vanilla va a ~8). El movimiento sigue siendo cada tick, pero cada tick hace menos
  trabajo: se guardan en memoria los rieles ya leídos y los trenes detenidos casi no cuestan.
- **Inclinación arreglada:** la carrocería se inclina en las subidas y en las bajadas.
- **Vagones unidos:** dos o más vagones sobre la misma vía se enganchan solos al ponerlos juntos o al
  chocar. Desde ahí se mueven como un tren, cada vagón siguiendo la vía por su cuenta. Maneja el
  conductor del vagón de adelante. Para desenganchar, el jugador interactúa agachado con un vagón.
  Al quitar un vagón a golpes, el tren se parte en dos.
- Solo en el build de desarrollo: el conductor ve la velocidad y la inclinación en la action bar, para
  diagnosticar en el iPad.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `elevator`: el indicador de piso ya no muestra título, el último piso se llama PH y la detección de
  pisos ignora alfombras, carteles y antorchas.
- `metro-train`: los rieles propulsores aceleran (encendidos) o frenan (apagados), sube la velocidad
  máxima, se corrige la inclinación y se agregan los vagones unidos.

## Impact

- `src/elevator/` (floors, elevator, indicator), `src/train/` (rails, physics, train, spawn y un
  módulo nuevo para los trenes unidos) y textos `es_MX`/`en_US`.
- `packs/RP/entity/metro_car.entity.json` (formato de la client entity) y
  `packs/BP/entities/metro_car.json` (sin cambios de componentes previstos).
- Versión 0.3.0. Sin dependencias nuevas. El enganche se guarda en dynamic properties de cada vagón,
  así que desaparece con la entidad al quitar el add-on.
