# Spec Delta

## ADDED Requirements

### Requirement: Ícono y nombre de los packs
El BP y el RP SHALL incluir un `pack_icon.png` cuadrado en su raíz, que Minecraft muestra al importar el
`.mcaddon` y en la lista de packs. El ícono MUST NOT usar texturas ni logos de Mojang ni de terceros. Los
dos packs SHALL llamarse "Elevator & Trains" (con el sufijo BP o RP) en todos los idiomas, y su
descripción SHALL seguir traducida.

#### Scenario: Importar el add-on
- **WHEN** Daniel abre el `.mcaddon` en el iPad y Minecraft importa los packs
- **THEN** los dos packs se muestran con el ícono del add-on, no con el ícono por defecto

#### Scenario: Lista de packs del mundo
- **WHEN** el jugador abre los paquetes de comportamiento o de recursos de un mundo
- **THEN** ve "Elevator & Trains (BP)" o "Elevator & Trains (RP)" con su ícono y la descripción en su idioma
