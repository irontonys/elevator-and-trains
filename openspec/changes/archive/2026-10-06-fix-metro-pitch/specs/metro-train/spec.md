# Spec Delta

## MODIFIED Requirements

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
