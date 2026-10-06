# Spec Delta

## ADDED Requirements

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
