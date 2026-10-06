# elevadores-trenes

> Contexto de ESTE proyecto. Claude lo lee automáticamente al abrir esta carpeta.
> Mantenlo corto y actualizado: si algo ya no es cierto, bórralo.

## Qué es
Add-on público de Minecraft Bedrock para publicar en MCPDL: elevadores de edificio con bloques
custom (inicio/límite) y trenes de metro grandes sobre rieles vanilla. Detalle y alcance:
`.claude/context/objetivo.md`.

## Estado
- Fase: 0.3.3 probada en iPad (elevador, metro, propulsores, vagones unidos, inclinación, sonido de
  rieles e ícono). Todos los changes están archivados; specs vigentes en `openspec/specs/`. Paleta del
  metro = placeholder hasta tener fotos.
- Siguiente: publicar en CurseForge → MCPEDL (desde abril de 2025 MCPEDL solo recibe por CurseForge).
  Textos, avatar, portada y checklist en `publish/`; faltan las capturas del iPad.
- Actualizado: 2026-10-06

## Stack
- Minecraft Bedrock: Behavior Pack + Resource Pack.
- Mismo enfoque que `../civiles`: TypeScript + Script API estable, empaquetado con esbuild,
  especificación con OpenSpec (`openspec/`, en español; toda feature entra como change:
  `/opsx:propose` → `/opsx:apply` → `/opsx:archive`).
- **Versión objetivo: siempre la última estable de Mojang, nunca una anterior.** Revisar
  `npm view @minecraft/server dist-tags` (tag `latest`, nunca `beta`/`rc`/`preview`) y usar esa
  versión en `min_engine_version` y `format_version`.
  Hoy: 1.26.50 → `@minecraft/server` 2.10.0, `@minecraft/server-ui` 2.2.0 (versiones exactas).
- Manifest `format_version: 2` mientras la v3 siga en preview (revisar al empezar cada change).

## Estructura
- `packs/BP`, `packs/RP`: fuentes de los packs (manifests con UUIDs fijos; la versión la pone el build).
- `src/main.ts`: arranque (startup → worldLoad). `src/elevator/floors.ts`: lógica pura de pisos
  (con pruebas en `*.test.ts`). `src/elevator/elevator.ts`: input del jugador y teleport.
  `src/elevator/indicator.ts`: piso actual en título y action bar.
- `src/train/`: `track.ts` (vía a partir de `rail_direction`, pura), `bogies.ts` (pose y avance,
  pura), `physics.ts` (velocidad y propulsores, pura), `consist.ts` (vagones unidos, pura),
  `train.ts` (trenes, conductor, choques, enganche y golpes), `spawn.ts` (item), `rails.ts` (lee
  los rieles con caché de 1 s), `config.ts` (constantes).
- `tools/gen-metro.mjs`: genera el modelo, la textura y el ícono del vagón (su salida se versiona en
  `packs/RP`; `PALETTE` al inicio). `--preview <carpeta>` saca vistas previas.
- `tools/gen-art.mjs`: renderiza el vagón real y genera `pack_icon.png` (BP y RP), `publish/avatar.png` y
  `publish/cover.png`. Se corre a mano después de `gen-metro.mjs`.
- `publish/`: material de la publicación (`listing.md` con textos y checklist). No entra al `.mcaddon`.
  En los textos públicos el vagón es solo "metro": no se menciona ninguna ciudad ni marca.
- `tools/build.mjs`: typecheck → copia packs → versión de `package.json` → esbuild → `.mcaddon`.
  `tools/test.mjs`: corre las pruebas con mocks.
- `dist/` (ignorado): `eleytren_BP/`, `eleytren_RP/` y `elevadores-trenes.mcaddon`.
- `openspec/`: specs y changes.

## Cómo correrlo
```bash
npm install
npm run typecheck
npm run test          # lógica de pisos con mocks
npm run build         # dev: avisa en el chat que cargó → dist/elevadores-trenes.mcaddon
npm run build:release # release: minificado y sin aviso
```
- No hay Minecraft en esta Mac: se prueba mandando el `.mcaddon` por AirDrop/Archivos a un
  iPad/iPhone y entrando a un mundo de prueba. Minecraft ignora un `.mcaddon` con la misma versión
  ya instalada: cada build de prueba sube la versión de parche en `package.json`.

## Convenciones de este proyecto
- Namespace de todos los identificadores: `eleytren:` (ej. `eleytren:elevator_block`).
- **Elevador:** un bloque de inicio y un bloque de límite (igual) marcan el rango vertical. El
  script escanea entre ambos y detecta los pisos por **suelo real** (bloques), no por altura fija.
  Saltar dentro del elevador sube **un piso por salto**; agacharse baja **un piso**. Pisos: PB, 1,
  2, … PH (solo en la action bar). Alfombras, carteles y antorchas cuentan como aire.
- **Tren:** vagón de metro (estilo Metrorrey, sin logos) de ~6 bloques que corre sobre rieles vanilla
  existentes. Lo maneja el primer jugador que sube a la cabeza (adelante/atrás); el script lo mueve
  siguiendo la vía, no la física del carrito vanilla. Propulsor encendido = acelera solo (20 b/s),
  apagado = estación. Hasta 4 vagones enganchados. La inclinación va en la rotación X del vagón (sin
  propiedades de entidad) y suena `minecart.base` en lugar de pasos.

## Reglas para Claude en este proyecto
- **Nunca sobrescribir contenido vanilla** (`minecraft:*`, rieles, etc.). Solo contenido propio.
- **Nada de APIs beta ni toggles experimentales.** Solo módulos estables.
- **Nada de JSON UI** (`RP/ui/`). La interfaz va solo con `@minecraft/server-ui`.
- **Los UUIDs del manifest no se regeneran** una vez publicados. Solo se sube la versión.
- **Quitar el add-on no debe romper el mundo:** no modificar bloques/estructuras vanilla de forma
  permanente, no dejar comandos o scoreboards de los que dependa el mundo.
- Antes de dar algo por terminado: el Content Log debe quedar sin errores ni warnings. Como no se
  puede correr el juego aquí, pedir a Daniel que lo revise en el iPad.

## Contexto extra
<!-- Documentos largos que NO deben ocupar contexto siempre. Léelos solo cuando aplique. -->
- `.claude/context/bitacora.md` — dónde quedamos la última sesión (se escribe sola al cerrar)
- `.claude/context/objetivo.md` — objetivo, alcance y lo que queda fuera
- `.claude/context/decisiones.md` — bitácora de decisiones técnicas
- `.claude/context/glosario.md` — términos del dominio
