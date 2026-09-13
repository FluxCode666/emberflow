---
name: emberflow-ui
description: Create or adapt frontend interfaces with the Emberflow particle canvas style: left-flowing texture, independently moving flame tails, configurable density, height, gaps, pointer interaction, and reusable HTML/React/Vue integrations.
metadata:
  short-description: Use the Emberflow particle UI style in frontend projects
---

# Emberflow UI

Use this skill when a user asks for a particle background, floating dot matrix, animated flame tail, tab surface texture, or a UI that should reuse the Emberflow visual language.

## Use the existing engine

Prefer the shared `driftfield.js` engine when the project can load a standalone Canvas module. It exposes `mountDriftfield(canvas, options)`, which returns `update()`, `destroy()`, and `stats`. Keep the canvas grid stationary while the texture samples flow left. The flame head stays on the right; each row's tail grows and retracts independently so the longest and shortest rows change over time.

If the target project is this repository, edit `index.html`, `styles.css`, `app.js`, and `driftfield.js` together when behavior changes. If the target is another project, copy only the engine and the integration needed by that project. Do not introduce a framework or build step for a plain HTML integration.

## Preserve the visual contract

- Keep `tailVariance` between 3 and 20 cells; it controls the actual silhouette range.
- Keep `gapRate` in the engine as 0–1 and in UI controls as 0–100%; default is 0 for a continuous flame.
- Keep `height` between 50 and 1000px.
- Keep `speed` independent from flame length; speed changes leftward texture flow only.
- Keep pointer repulsion opt-in (`pointer: false` by default).
- Do not add special white or bright tail colors. Tail cells use the same body color shading.
- Avoid random interior holes when `gapRate` is 0. Low-performance sampling is an explicit opt-in.
- Cache row contour values once per frame instead of recalculating them for every cell.

For code generation, make all configuration examples match the user's current values. When a wrapper imports the engine as an ES module, expose `mountDriftfield` from the copied module and clean up the returned instance on unmount.

## Choose the smallest integration

- Plain HTML: include a canvas with an explicit height, load `driftfield.js`, and call `mountDriftfield`.
- React: create the canvas with `useRef`, mount in `useEffect`, and call `destroy` in the cleanup function.
- Vue 3: use `ref`, `onMounted`, and `onBeforeUnmount` with the same cleanup.
- Existing Canvas/WebGL systems: port the row contour and leftward sampling ideas, but avoid moving the whole particle grid diagonally or upward.

Read [references/usage-examples.md](references/usage-examples.md) when the user asks for a concrete integration or configuration mapping. It contains copyable examples and the API contract.

## Verify the result

For visual work, open the real browser and verify the target page. Check that animation changes across time, the longest and shortest rows migrate, `gapRate: 0` has no interior holes, and the requested height renders. Also check the console for page errors. For a code-only integration, run the project's normal syntax/build checks and a small browser smoke test when available.
