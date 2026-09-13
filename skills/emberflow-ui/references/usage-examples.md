# Emberflow UI usage examples

## HTML

```html
<canvas id="emberflow" style="width:100%;height:320px;background:#131516"></canvas>
<script src="./driftfield.js"></script>
<script>
  const effect = mountDriftfield(document.querySelector('#emberflow'), {
    color: '#f5f0e8',
    background: '#131516',
    density: 0.68,
    speed: 1,
    size: 1,
    height: 320,
    tailVariance: 8,
    gapRate: 0,
    pointer: false,
    pointerStrength: 30
  });

  effect.update({ height: 500, tailVariance: 12 });
  // effect.destroy(); // call when removing the canvas
</script>
```

## React

```jsx
import { useEffect, useRef } from 'react';
import { mountDriftfield } from './driftfield.js';

export default function EmberflowCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const instance = mountDriftfield(canvasRef.current, {
      height: 320, gapRate: 0, pointer: false, tailVariance: 8
    });
    return () => instance.destroy();
  }, []);
  return <canvas ref={canvasRef} style={{ width: '100%', height: 320 }} />;
}
```

## Vue 3

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { mountDriftfield } from './driftfield.js';

const canvas = ref(null);
let instance;
onMounted(() => { instance = mountDriftfield(canvas.value, { height: 320, gapRate: 0, pointer: false }); });
onBeforeUnmount(() => instance?.destroy());
</script>
<template><canvas ref="canvas" style="width:100%;height:320px" /></template>
```

## Configuration mapping

| UI value | Engine value | Notes |
| --- | --- | --- |
| Height `50–1000px` | `height` in px | Canvas CSS height |
| Speed `0–200%` | `speed = ui / 42` | Texture flow only |
| Size `1–4px` | `size = ui / 3` | Particle size multiplier |
| Density `20–100%` | `density = ui / 100` | Body fullness |
| Tail gap `3–20` | `tailVariance` | Longest/shortest row difference |
| Gap `0–100%` | `gapRate = ui / 100` | `0` keeps the flame continuous |
| Pointer toggle | `pointer` | `false` by default |
| Pointer strength `0–100%` | `pointerStrength` | Only applies when pointer is enabled |

The standalone engine has no npm runtime dependency. Use the package installer to copy this skill into a Codex-compatible skills directory; the engine itself remains a normal project file.
