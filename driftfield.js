// Shared by the live playground and every generated implementation.
function mountDriftfield(canvas, options = {}) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  const ctx = context;
  const config = {
    color: '#f5f0e8', background: '#131516', seed: 23,
    density: 0.68, speed: 1, size: 1, height: 600,
    glow: 24, pointer: true, lowPerf: false, gap: 9, ...options
  };
  let width = 0, height = 0, columns = 0;
  let frame = 0, lastFrame = 0, destroyed = false;
  let particles = [];
  let rgb = '';
  const pointer = { x: -9999, y: -9999, active: false };
  const originalStyle = canvas.getAttribute('style');

  function randomAt(seed, x, y) {
    let value = seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  }

  function flowingNoise(seed, x, y) {
    const row = Math.floor(y), fraction = y - row;
    const blend = fraction * fraction * (3 - 2 * fraction);
    return randomAt(seed, x, row) * (1 - blend) + randomAt(seed, x, row + 1) * blend;
  }

  function sampleAt(seed, x, y) {
    const value = Math.sin(seed * 0.0001 + x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function resize() {
    if (destroyed) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    columns = Math.ceil(width / config.gap) + 1;
    const rows = Math.ceil(height / config.gap) + 1;
    const sampleRate = Math.min(1, (config.lowPerf ? 2200 : 4200) / (columns * rows));
    particles = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
      if (sampleRate < 1 && sampleAt(config.seed + 99, x, y) > sampleRate) continue;
      particles.push({ x, y });
    }
  }

  function paint(time) {
    if (destroyed) return;
    frame = requestAnimationFrame(paint);
    if (document.hidden || time - lastFrame < 33) return;
    lastFrame = time;
    ctx.clearRect(0, 0, width, height);
    const phase = time / 1000 * 1.5;
    const amplitude = Math.max(0.2, config.speed);
    const left = width - (columns * config.gap - 1);
    const recession = 1 - config.density;
    for (const p of particles) {
      const edgeNoise = flowingNoise(config.seed, 0, p.y + phase * 0.45);
      const baseEdge = columns * (0.385 + (edgeNoise - 0.5) * 0.33 * amplitude);
      const wave = Math.sin(p.y * 0.72 + phase * 2.1 + config.seed * 0.01) * 2.4
        + (flowingNoise(config.seed + 19, 0, p.y + phase * 1.25) - 0.5) * 10;
      const edge = baseEdge + recession * (columns + 5 - baseEdge)
        + recession * Math.sin(p.y * 0.7 + phase) * 2 + wave;
      const distance = p.x - edge;
      if (distance < -32) continue;
      const noise = flowingNoise(config.seed, p.x + 11, p.y + 7 + phase * 1.15);
      const tailNoise = flowingNoise(config.seed + 97, p.x + 7, p.y + 31 + phase * 1.8);
      const hotEmber = distance < 0 && distance >= -8 && noise > 0.52;
      const trail = distance < -8 && tailNoise > 0.52 + (-distance / 32) * 0.18;
      if (!(distance >= 0 ? distance > 2 || noise > 0.18 : hotEmber || trail)) continue;
      const coverage = hotEmber ? Math.min(1, (noise - 0.52) / 0.48)
        : trail ? Math.max(0.2, (distance + 32) / 24) : Math.min(1, Math.max(0, distance + 0.5));
      const fade = hotEmber || trail ? 1 : Math.min(1, 0.2 + Math.max(0, distance) / 18 * 0.8);
      let alpha = (hotEmber ? 0.2 + (noise - 0.52) * 0.62 : trail ? 0.06 + tailNoise * 0.16
        : (0.12 + p.x / Math.max(1, columns - 1) * 0.24 + noise * 0.12) * fade) * coverage;
      const px = left + p.x * config.gap + 4, py = p.y * config.gap + 4;
      let ox = 0, oy = 0;
      if (config.pointer && pointer.active) {
        const distanceToPointer = Math.hypot(px - pointer.x, py - pointer.y);
        if (distanceToPointer < 180) {
          const force = (1 - distanceToPointer / 180) ** 2 * 8;
          ox = (px - pointer.x) / (distanceToPointer || 1) * force;
          oy = (py - pointer.y) / (distanceToPointer || 1) * force;
          alpha = Math.min(0.96, alpha + (1 - distanceToPointer / 180) ** 2 * 0.34);
        }
      }
      const size = (hotEmber ? 3.4 + noise * 2.4 : trail ? 2.2 + tailNoise * 2.2
        : 6.6 + Math.min(1, Math.max(0, distance) / 18) * 1.4) * config.size;
      ctx.fillStyle = `rgba(${rgb},${Math.max(0.025, Math.min(0.9, alpha))})`;
      ctx.fillRect(px + ox - size / 2, py + oy - size / 2, size, size);
    }
  }

  function movePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }

  function leavePointer() { pointer.active = false; }

  function update(patch = {}) {
    if (destroyed) return;
    Object.assign(config, patch);
    rgb = [1, 3, 5].map(start => parseInt(config.color.slice(start, start + 2), 16)).join(',');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = config.height + 'px';
    canvas.style.backgroundColor = config.background;
    // One composited background glow avoids a costly blur on every particle.
    canvas.style.backgroundImage = `radial-gradient(ellipse at 85% 50%, rgba(${rgb},${config.glow / 100 * 0.1}), transparent 70%)`;
    resize();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  canvas.addEventListener('pointermove', movePointer);
  canvas.addEventListener('pointerleave', leavePointer);
  update();
  frame = requestAnimationFrame(paint);

  return {
    update,
    get stats() { return { width, height, count: particles.length }; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointermove', movePointer);
      canvas.removeEventListener('pointerleave', leavePointer);
      ctx.clearRect(0, 0, width, height);
      if (originalStyle === null) canvas.removeAttribute('style');
      else canvas.setAttribute('style', originalStyle);
    }
  };
}
