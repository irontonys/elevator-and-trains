# Proposal

## Why

El add-on se va a publicar en MCPEDL, que desde el 30 de abril de 2025 solo recibe proyectos por el
CurseForge Authors Console. Al importar el `.mcaddon` en Minecraft, los packs se ven sin ícono (sale el
ícono por defecto), y la publicación necesita un avatar de 400 × 400 que no sea un color sólido, una
imagen de portada para MCPEDL y textos de presentación. Daniel también quiere un nombre corto y simple
para el proyecto: **Elevator & Trains**.

## What Changes

- **Ícono de los packs:** `pack_icon.png` de 256 × 256 en el BP y en el RP, con un render isométrico del
  vagón real sobre su vía y un elevador detrás.
- **Nombre de los packs:** "Elevator & Trains (BP)" y "Elevator & Trains (RP)" en inglés y en español.
  Las descripciones siguen traducidas.
- **Generador de arte:** `tools/gen-art.mjs` renderiza el modelo y las texturas que ya están en
  `packs/RP` (sin assets vanilla) y produce el ícono de los packs, `publish/avatar.png` (400 × 400) y
  `publish/cover.png` (1280 × 720). Se corre a mano y su salida se versiona, como `gen-metro.mjs`.
- **Textos de la publicación:** `publish/listing.md` con nombre, resumen, descripción en inglés (primero)
  y español, instrucciones de instalación y la lista de pasos para subirlo por CurseForge.
- Versión 0.3.1.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `addon-packaging`: los packs llevan ícono y se llaman "Elevator & Trains".

## Impact

- `packs/BP/pack_icon.png`, `packs/RP/pack_icon.png`, `packs/*/texts/*.lang` (solo `pack.name`).
- Nuevos: `tools/gen-art.mjs`, `publish/` (avatar, portada y textos; no entran al `.mcaddon`).
- Sin cambios de código del juego ni de manifests. Los UUIDs no cambian.
- La publicación no menciona ninguna ciudad, red de transporte ni marca: el vagón se describe solo como
  "metro".
