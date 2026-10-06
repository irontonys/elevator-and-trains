# Design

## Context

Minecraft muestra `pack_icon.png` en la raíz de cada pack al importar y en la lista de packs del mundo.
CurseForge pide un avatar de 400 × 400 (sin colores sólidos, sin material con copyright) y MCPEDL usa
una imagen etiquetada "MCPEDL" como portada. No hay Minecraft en la Mac, así que no se pueden tomar
capturas del juego aquí.

## Goals / Non-Goals

**Goals:** ícono y arte reproducibles a partir del modelo real, sin assets vanilla ni dependencias
nuevas.

**Non-Goals:** capturas del juego (las toma Daniel en el iPad) y subir el proyecto (lo hace Daniel en
CurseForge).

## Decisions

1. **Render propio en Node (sin dependencias).** `gen-art.mjs` lee el `.geo.json` y las texturas PNG de
   `packs/RP`, y dibuja cada cara de cada cubo como un paralelogramo con proyección ortográfica, z-buffer,
   sombreado fijo por cara y supersampling 4×. Alternativa descartada: ImageMagick/Blender, porque no son
   parte del proyecto y el resultado no se podría regenerar solo con `npm install`.
2. **Escenario procedural.** El pasto, la tierra, los durmientes y los rieles son texturas generadas con
   ruido fijo, para no copiar texturas de Mojang.
3. **El mismo render para el ícono y el avatar**, solo cambia el tamaño. La portada muestra 3 vagones
   unidos y un elevador.
4. **`publish/` fuera de `packs/`**, para que el build no lo meta al `.mcaddon`.

## Risks / Trade-offs

- El ícono es una ilustración, no una captura del juego. Las capturas reales van en la galería de la
  publicación.
- Si cambia la paleta del vagón (hoy placeholder), hay que volver a correr `gen-metro.mjs` y luego
  `gen-art.mjs`.
