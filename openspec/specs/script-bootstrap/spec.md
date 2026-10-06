# script-bootstrap Specification

## Purpose
Define el punto de entrada del script del add-on y su ciclo de arranque, para que las features futuras
(elevador, trenes) se registren y toquen el mundo en el momento correcto según Scripting V2.

## Requirements

### Requirement: Arranque en dos fases
El script SHALL tener una fase de registro, que corre durante el evento de arranque antes de que exista
el mundo y es el único lugar donde se registran custom components, y una fase de mundo, que corre
cuando el mundo terminó de cargar. Ninguna lectura ni escritura del mundo MUST ocurrir antes de la fase
de mundo.

#### Scenario: Carga normal del mundo
- **WHEN** se abre un mundo con el add-on activo
- **THEN** primero corre la fase de registro, después corre la fase de mundo una sola vez, y el Content Log no muestra errores de acceso al mundo antes de tiempo

#### Scenario: Recarga de scripts
- **WHEN** se ejecuta `/reload` en un mundo con el add-on activo
- **THEN** el arranque vuelve a completarse sin errores ni warnings en el Content Log

### Requirement: Aviso de carga solo en desarrollo
En el build de desarrollo, el add-on SHALL avisar en el chat, al iniciar la fase de mundo, que cargó y
qué versión es. En el build de release MUST NOT mandar ningún mensaje.

#### Scenario: Comprobación en el iPad
- **WHEN** se abre un mundo con el `.mcaddon` del build de desarrollo
- **THEN** el chat muestra un mensaje con el nombre del add-on y su versión

#### Scenario: Release silencioso
- **WHEN** se abre un mundo con el `.mcaddon` del build de release
- **THEN** el add-on no manda mensajes al chat

### Requirement: Desinstalación sin rastro
El arranque MUST NOT crear scoreboards, ejecutar comandos que dejen estado, modificar bloques ni guardar
estado fuera de las dynamic properties del propio add-on.

#### Scenario: Quitar el add-on
- **WHEN** se abre un mundo donde estuvo activo el add-on, después de desactivar y quitar ambos packs
- **THEN** el mundo carga sin errores en el Content Log, no queda ningún scoreboard del add-on y el script no modificó ningún bloque (los únicos rastros son los bloques de elevador que colocó el jugador, que quedan como bloque desconocido)
