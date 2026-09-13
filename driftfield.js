// Shared by the live playground and every generated implementation.
function mountDriftfield(canvas, options = {}) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  const ctx = context;
  const config = {
    color: '#f5f0e8', background: '#131516', seed: 23,
    density: 0.68, speed: 1, size: 1, tailVariance: 8, gapRate: 0.3, height: 320,
    glow: 24, pointerStrength: 30, pointer: true, lowPerf: false, gap: 9, ...options
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

  function flowingNoiseX(seed, x, y) {
    const left = Math.floor(x), fraction = x - left;
    const blend = fraction * fraction * (3 - 2 * fraction);
    return flowingNoise(seed, left, y) * (1 - blend) + flowingNoise(seed, left + 1, y) * blend;
  }

  function sampleFlameRows(seed, rows, columns, seconds, density = 1, tailWidth = 32, tailVariance = 8) {
    rows = Math.max(1, rows);
    const strengths = new Float64Array(rows);
    const edges = new Float64Array(rows);
    let minimum = Infinity, maximum = -Infinity;
    for (let y = 0; y < rows; y++) {
      // Time has its own noise axis: rows grow/retract without scrolling a fixed profile vertically.
      const value = flowingNoiseX(seed + 211, seconds * 0.48, y * 0.34 + 41) * 0.72
        + flowingNoiseX(seed + 503, seconds * 0.77 + 17, y * 0.8 + 23) * 0.28;
      strengths[y] = value;
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    const variance = Math.min(Math.max(3, Math.min(20, tailVariance)), Math.max(0, columns - 5));
    const baseEdge = columns * 0.385;
    const centerEdge = baseEdge + (1 - density) * (columns + 5 - baseEdge);
    // Keep the complete tip range on the canvas, including narrow Tab previews.
    const tipCenter = Math.max(2 + variance / 2,
      Math.min(columns - 2 - variance / 2, centerEdge - tailWidth + variance / 2));
    const tailLimit = Math.max(0, Math.min(tailWidth - variance / 2, centerEdge - tipCenter));
    const range = maximum - minimum;
    for (let y = 0; y < rows; y++) {
      const strength = range > 0.00001 ? (strengths[y] - minimum) / range : 0.5;
      strengths[y] = strength;
      // Move the actual silhouette and its fade together; no row has a permanent length bias.
      edges[y] = tipCenter + (0.5 - strength) * variance + tailLimit;
    }
    return { edges, strengths, tailLimit };
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
    const sampleRate = config.lowPerf ? Math.min(1, 2200 / (columns * rows)) : 1;
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
    // Texture speed is independent from the contour clock and length range.
    const gridWidth = columns * config.gap;
    // Unbounded texture coordinates avoid a seam when the canvas width is crossed.
    const flowOffset = time / 1000 * (6 + config.speed * 10);
    const left = width - (gridWidth - 1);
    const contour = sampleFlameRows(config.seed, Math.ceil((height - 4) / config.gap), columns, time / 1000, config.density, 32, config.tailVariance);
    for (const p of particles) {
      const sampleX = p.x + flowOffset / config.gap;
      const fieldY = p.y * 0.42;
      const fieldX = sampleX * 0.42;
      const row = Math.min(p.y, contour.edges.length - 1);
      const distance = p.x - contour.edges[row];
      const tailLimit = contour.tailLimit;
      if (distance < -tailLimit) continue;
      const noise = flowingNoiseX(config.seed, fieldX + 11, fieldY + 7);
      const tailNoise = flowingNoiseX(config.seed + 97, fieldX + 7, fieldY + 31);
      const tailDrift = flowingNoiseX(config.seed + 503, p.x * 0.16 + time / 1000 * 0.48, p.y * 0.16 + 23);
      const rowTail = contour.strengths[row];
      const tailSignal = Math.max(0, Math.min(1, tailNoise + (tailDrift - 0.5) * 0.26 + (rowTail - 0.5) * 0.16));
      const tailProgress = Math.max(0, Math.min(1, (-distance - 8) / Math.max(1, tailLimit - 8)));
      const tone = Math.min(1, Math.max(0, (noise - 0.16) / 0.72));
      const gapRate = Math.max(0, Math.min(1, config.gapRate));
      const hotEmber = distance < 0 && distance >= -8 && noise > 0.52;
      const trail = distance < -8 && (gapRate === 0 || tailSignal > 0.3 + tailProgress * 0.34);
      if (!(distance >= 0 ? (gapRate === 0 || distance > 2 || noise > 0.18) : (gapRate === 0 || hotEmber || trail))) continue;
      const gapSample = flowingNoiseX(config.seed + 607, fieldX * 1.35 + fieldY * 0.1, fieldY * 1.15 + 17);
      if (gapRate > 0 && gapSample < gapRate) continue;
      const naturalTailCoverage = Math.max(0.45, 1 - tailProgress * 0.55);
      const coverage = gapRate === 0
        ? (distance < 0 ? naturalTailCoverage : 1)
        : hotEmber ? 1
          : trail ? Math.max(0.24, (distance + tailLimit) / (tailLimit - 8)) : Math.min(1, Math.max(0, distance + 0.5));
      // Apply the same shading to the body and tail, with no ember highlight.
      const geometricFade = Math.min(1, 0.2 + Math.max(0, distance) / 18 * 0.8);
      let alpha = (0.07 + p.x / Math.max(1, columns - 1) * 0.34 + tone * 0.24) * geometricFade * coverage;
      if (gapRate === 0) alpha = Math.max(alpha, 0.16 * (distance < 0 ? naturalTailCoverage : 1));
      const px = left + p.x * config.gap + 4, py = p.y * config.gap + 4;
      let ox = 0, oy = 0;
      if (config.pointer && pointer.active) {
        const distanceToPointer = Math.hypot(px - pointer.x, py - pointer.y);
        if (distanceToPointer < 180) {
          const force = (1 - distanceToPointer / 180) ** 2 * 8 * (config.pointerStrength / 30);
          ox = (px - pointer.x) / (distanceToPointer || 1) * force;
          oy = (py - pointer.y) / (distanceToPointer || 1) * force;
          alpha = Math.min(0.96, alpha + (1 - distanceToPointer / 180) ** 2 * 0.34 * (config.pointerStrength / 30));
        }
      }
      const size = (hotEmber ? 3.4 + noise * 2.4 : trail ? 2.2 + tailSignal * 2.2
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
