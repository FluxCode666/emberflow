// Real Canvas regression. Serve the project on :4173; install playwright-core externally.
// NODE_PATH=/tmp/driftfield-browser-tools/node_modules node tests/flame-contour.cjs
const { chromium } = require('playwright-core');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const out = process.env.FLAME_TEST_OUTPUT || '/tmp/driftfield-contour';
const url = process.env.FLAME_TEST_URL || 'http://127.0.0.1:4173';
fs.mkdirSync(out, { recursive: true });
const errors = [];
const report = { url, viewport: { width: 1800, height: 1000 }, authentication: 'isolated browser, no login', scenarios: {} };

function clockAndCapture() {
  const nativeFrame = window.requestAnimationFrame.bind(window);
  let next = 0, callbacks = new Map();
  window.requestAnimationFrame = cb => { callbacks.set(++next, cb); return next; };
  window.cancelAnimationFrame = id => callbacks.delete(id);
  window.draws = {};
  const original = CanvasRenderingContext2D.prototype.fillRect;
  CanvasRenderingContext2D.prototype.fillRect = function(x, y, w, h) {
    const key = this.canvas.id || this.canvas.dataset.tabTexture || this.canvas.dataset.modelTexture || 'other';
    (window.draws[key] ||= []).push({ x: x + w / 2, y: y + h / 2, size: w, color: this.fillStyle });
    return original.call(this, x, y, w, h);
  };
  window.renderAt = async time => {
    await new Promise(nativeFrame);
    window.draws = {};
    const current = callbacks;
    callbacks = new Map();
    const start = performance.now();
    for (const cb of current.values()) cb(time);
    return performance.now() - start;
  };
}

async function setup(browser, { width = 1800, height = 320, variance = 8, speed = 42, gap = 0, baseline = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(String(error)));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(clockAndCapture);
  if (baseline) for (const [pattern, file, contentType] of [
    [url.replace(/\/$/, '') + '/', 'index.html', 'text/html'],
    ['**/app.js', 'app.js', 'text/javascript'], ['**/styles.css', 'styles.css', 'text/css'],
  ]) await page.route(pattern, route => route.fulfill({
    body: execFileSync('git', ['show', `40b05a0:${file}`], { encoding: 'utf8' }), contentType,
  }));
  await page.goto(url);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto}.reveal{animation:none}' });
  for (const [id, value] of Object.entries({height, tailVariance: variance, speed, gapRate: gap})) {
    await page.locator(`#${id}`).fill(String(value));
  }
  await page.locator('#pointerToggle').click();
  await page.mouse.move(0, 0);
  await page.locator('#particleCanvas').evaluate(el => el.scrollIntoView({ block: 'center' }));
  return page;
}

async function capture(page, time) {
  const frameMs = await page.evaluate(t => window.renderAt(t), time);
  const data = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#particleCanvas,[data-tab-texture],[data-model-texture],#particle-canvas')].map(el => {
    const key = el.id || el.dataset.tabTexture || el.dataset.modelTexture;
    return [key, { width: el.clientWidth, height: el.clientHeight, calls: window.draws[key] || [] }];
  })));
  return { time, frameMs, data };
}

function outline(canvas, zeroGap = true) {
  const rows = new Map();
  for (const c of canvas.calls) {
    if (c.x < 0 || c.x >= canvas.width || c.y < 0 || c.y >= canvas.height) continue;
    const row = Math.round((c.y - 4) / 9);
    (rows.get(row) || (rows.set(row, []), rows.get(row))).push(c.x);
  }
  assert(rows.size > 0, 'Canvas must render visible rows');
  const tips = [];
  for (const [row, xs] of rows) {
    xs.sort((a,b) => a-b);
    if (zeroGap) for (let i=1; i<xs.length; i++) assert(Math.abs(xs[i] - xs[i-1] - 9) < 0.01, `Interior hole in row ${row + 1}`);
    tips[row] = xs[0];
  }
  const minimum = Math.min(...tips), maximum = Math.max(...tips);
  return { tips, spread: (maximum - minimum) / 9,
    longest: tips.flatMap((x,y) => Math.abs(x-minimum)<0.01 ? [y+1] : []),
    shortest: tips.flatMap((x,y) => Math.abs(x-maximum)<0.01 ? [y+1] : []),
  };
}

function summarize(frames, key, variance, validate = true) {
  const outlines = frames.map(f => ({ time: f.time, ...outline(f.data[key]) }));
  const longestRows = [...new Set(outlines.flatMap(o => o.longest))].sort((a,b)=>a-b);
  const shortestRows = [...new Set(outlines.flatMap(o => o.shortest))].sort((a,b)=>a-b);
  const rows = outlines[0].tips.length;
  if (validate) {
    for (const o of outlines) assert(Math.abs(o.spread-variance)<0.01, `${key}: expected ${variance} cells of range, got ${o.spread}`);
    for (const [label, values] of Object.entries({longestRows, shortestRows})) {
      assert(values.length >= Math.min(rows, 4), `${key}: ${label} must change`);
      assert(Math.max(...values) - Math.min(...values) >= (rows-1)*.6, `${key}: ${label} must cross distinct height regions`);
      assert(!outlines.every(o => o[label==='longestRows' ? 'longest' : 'shortest'].includes(values[0])), `${key}: extremum must stop belonging to the original row`);
    }
    const swaps = longestRows.filter(y=>shortestRows.includes(y));
    assert(swaps.length >= 2, `${key}: multiple rows must become BOTH longest and shortest`);
  }
  return { rows, longestRows, shortestRows, spread: [...new Set(outlines.map(o=>Math.round(o.spread)))],
    examples: outlines.filter((_,i)=>i%8===0).map(({tips,...o})=>o) };
}

(async () => {
  const browser = await chromium.launch({ headless: false, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  report.browser = browser.version();
  try {
    if (!process.env.FLAME_TEST_FOCUS) {
    const baseline = await setup(browser, {baseline:true});
    const oldFrames = [];
    for (let t=1000; t<=25000; t+=500) oldFrames.push(await capture(baseline,t));
    report.baseline = summarize(oldFrames, 'particleCanvas', 8, false);
    await baseline.locator('#particleCanvas').screenshot({path:`${out}/before.png`});
    await baseline.close();
    }
    let copied, standardFrames;
    for (const options of [
      { name: 'default' }, { name: 'height50', height:50 }, { name: 'height500', height:500 },
      { name: 'variance3', variance:3 }, { name: 'variance20', variance:20 },
      { name: 'mobile', width:390 }, { name:'speed0', speed:0 }, { name:'speed200', speed:200 },
    ].filter(options => !process.env.FLAME_TEST_FOCUS || options.name === 'default')) {
      const page = await setup(browser, options);
      const frames = [];
      for (let t=1000; t<=25000; t+=500) {
        frames.push(await capture(page,t));
        if(options.name==='default' && t<=9000 && t%2000===1000) await page.locator('#particleCanvas').screenshot({path:`${out}/frame-${t}.png`});
      }
      report.scenarios[options.name] = summarize(frames, 'particleCanvas', options.variance || 8);
      console.log('Passed:', options.name);
      if (options.name === 'default') {
        standardFrames = frames;
        report.renderMs = frames.map(f=>f.frameMs).sort((a,b)=>a-b);
        for(const key of ['github','figma','notion','linear','sol','astra']) report.scenarios[key]=summarize(frames,key,8);
        await page.locator('.model-grid').screenshot({path:`${out}/models.png`});
        await page.locator('.tab-demo-list').screenshot({path:`${out}/tabs.png`});
        await page.locator('#viewCode').click();
        assert.equal(await page.locator('#codeModal').getAttribute('aria-hidden'),'false');
        copied=await page.locator('#codeModalOutput').textContent();
        assert(copied.includes('tailVariance: 8') && copied.includes('gapRate: 0'));
        for(const language of ['html','typescript','react','vue']) {
          await page.locator(`[data-code-language="${language}"]`).click();
          const code=await page.locator('#codeModalOutput').textContent();
          assert(code.includes('tailVariance: 8') && code.includes('gapRate: 0'));
        }
      }
      if (options.name.startsWith('speed')) {
        for(let i=0;i<frames.length;i++) assert.deepEqual(outline(frames[i].data.particleCanvas),outline(standardFrames[i].data.particleCanvas),'Speed must not change the silhouette at matched times');
      }
      if (options.name==='mobile') await page.locator('#particleCanvas').screenshot({path:`${out}/mobile.png`});
      await page.close();
    }
    // Execute what users copy, plus the independently embeddable engine, in real pages.
    for (const name of ['copied','standalone','seed5601','seed7813']) {
      const page=await browser.newPage({viewport:{width:1800,height:1000},deviceScaleFactor:1});
      page.on('pageerror',e=>errors.push(`${name}: ${e}`));
      await page.setContent(`<div style="width:${standardFrames[0].data.particleCanvas.width}px"><canvas id="particle-canvas" style="display:block;width:100%;height:320px;background:#131516"></canvas></div>`);
      await page.evaluate(clockAndCapture);
      const seed=name==='seed5601'?5601:name==='seed7813'?7813:23;
      const source=name==='copied'?copied:fs.readFileSync('driftfield.js','utf8')+`\nmountDriftfield(document.querySelector('canvas'),{gapRate:0,pointer:false,seed:${seed}});`;
      await page.addScriptTag({content:source});
      const frames=[];
      for(let t=1000;t<=25000;t+=500) frames.push(await capture(page,t));
      report.scenarios[name]=summarize(frames,'particle-canvas',8);
      if(seed===23) for(let i=0;i<frames.length;i++) {
        const actual=frames[i].data['particle-canvas'].calls, expected=standardFrames[i].data.particleCanvas.calls;
        assert.equal(actual.length,expected.length,`${name} visible cell count`);
        // Grid layout uses fractional CSS width in the page and integer clientWidth in the embed.
        for(let j=0;j<actual.length;j++) {
          const a=actual[j],e=expected[j];
          assert(Math.abs(a.x-e.x)<0.51 && Math.abs(a.y-e.y)<1e-8 && Math.abs(a.size-e.size)<1e-8 && a.color===e.color,`${name} frame ${i}, cell ${j}: color/size/grid mismatch`);
        }
      }
      console.log('Passed:', name);
      await page.locator('canvas').screenshot({path:`${out}/${name}.png`});
      await page.close();
    }
    const gaps=await setup(browser,{gap:30});
    const g0=await capture(gaps,1000), g1=await capture(gaps,2000);
    assert(g0.data.particleCanvas.calls.length<standardFrames[0].data.particleCanvas.calls.length);
    assert.notDeepEqual(g0.data.particleCanvas.calls,g1.data.particleCanvas.calls);
    await gaps.locator('#particleCanvas').screenshot({path:`${out}/gap30.png`});
    await gaps.close();
    assert.deepEqual(errors, []);
    report.passed=true;
    console.log(JSON.stringify({passed:true,scenarios:Object.keys(report.scenarios),default:report.scenarios.default,renderMedianMs:report.renderMs[Math.floor(report.renderMs.length/2)],errors},null,2));
  } catch(error) {
    report.failure=String(error).slice(0,1500);
    for (const context of browser.contexts()) for(const page of context.pages()) await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});
    throw error;
  } finally {
    report.errors=errors;
    fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
    await browser.close();
  }
})().catch(e=>{console.error(String(e).slice(0,1500));process.exitCode=1});
