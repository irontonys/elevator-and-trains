# addon-packaging Specification

## Purpose
Define cómo se estructuran el Behavior Pack y el Resource Pack del add-on y cómo se produce el `.mcaddon`
instalable que se manda al iPad/iPhone para probarlo en la última versión estable de Bedrock.

## Requirements

### Requirement: El add-on se entrega como un único `.mcaddon`
El build SHALL producir un solo archivo `.mcaddon` que contenga el Behavior Pack y el Resource Pack del
add-on, y que se pueda instalar abriéndolo en iPad/iPhone sin pasos manuales extra.

#### Scenario: Build exitoso genera el instalable
- **WHEN** se ejecuta el build de desarrollo o el de release sobre un checkout limpio con dependencias instaladas
- **THEN** existe un archivo `.mcaddon` en la carpeta de salida que contiene exactamente un BP y un RP, cada uno con su `manifest.json` en la raíz del pack

#### Scenario: Error de compilación detiene el build
- **WHEN** el código TypeScript tiene errores de tipos o de sintaxis
- **THEN** el build termina con código de salida distinto de cero y no genera ni sobrescribe el `.mcaddon`

#### Scenario: Instalación en el dispositivo
- **WHEN** Daniel abre el `.mcaddon` en el iPad/iPhone
- **THEN** Minecraft importa ambos packs sin errores de importación

### Requirement: Los packs apuntan solo a la última versión estable
Los manifests SHALL declarar como `min_engine_version` la versión estable vigente de Bedrock y SHALL
depender únicamente de módulos de script con versión estable (sin sufijo `-beta`, `-rc` ni `-preview`).
El add-on MUST funcionar sin activar ningún toggle experimental en el mundo.

#### Scenario: Mundo sin experimentales
- **WHEN** se activan ambos packs en un mundo nuevo sin toggles experimentales
- **THEN** el mundo carga y el Content Log no muestra errores ni warnings atribuibles al add-on

#### Scenario: Dependencias de script estables
- **WHEN** se revisa el manifest del BP generado
- **THEN** cada dependencia de módulo de script declara una versión estable que coincide con la versión `latest` del paquete npm correspondiente usada en el build

### Requirement: Identidad permanente de los packs
Cada pack SHALL tener UUIDs de header y de módulos fijos, que no cambian entre builds ni entre
versiones publicadas. El BP SHALL declarar dependencia del RP por UUID y el RP SHALL declarar
dependencia del BP, de modo que al activar uno se active el otro.

#### Scenario: Rebuild conserva identidad
- **WHEN** se ejecuta el build dos veces seguidas, o después de subir la versión
- **THEN** los UUIDs de los manifests generados son idénticos en ambos `.mcaddon`

#### Scenario: Activación conjunta
- **WHEN** el jugador activa solo el BP en la configuración del mundo
- **THEN** Minecraft ofrece o activa también el RP del add-on

### Requirement: Versión única del add-on
La versión de ambos packs SHALL derivarse de una sola fuente de versión del proyecto, de modo que BP y
RP siempre publiquen la misma versión, y las dependencias entre ellos apunten a esa misma versión.

#### Scenario: Subir versión
- **WHEN** se cambia la versión del proyecto de 0.1.0 a 0.2.0 y se ejecuta el build
- **THEN** el `header.version` de ambos manifests y la versión en sus dependencias mutuas valen 0.2.0

### Requirement: Contenido propio y nombres localizados
Los packs MUST NOT incluir archivos que sobrescriban contenido vanilla. Todo identificador propio
SHALL usar el namespace `eleytren`. El nombre y la descripción de los packs SHALL mostrarse traducidos
en español (México) e inglés (EE. UU.).

#### Scenario: Nombre en español
- **WHEN** el juego está en español (México) y el jugador abre la lista de packs
- **THEN** los packs aparecen con su nombre y descripción en español, no con claves de traducción sin resolver

#### Scenario: Sin archivos vanilla
- **WHEN** se inspecciona el contenido del `.mcaddon`
- **THEN** no hay archivos que reemplacen definiciones vanilla (por ejemplo `player.json`, rieles o bloques `minecraft:*`)
