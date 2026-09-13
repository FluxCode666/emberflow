const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const state = { density: 68, speed: 42, size: 3, height: 320, glow: 24, pointerStrength: 30, color: '#f5f0e8', pointer: true, lowPerf: false, seed: 23, preset: 'midnight' };
const presets = { midnight:{density:68,speed:42,size:3,glow:24,color:'#f5f0e8',bg:'#131516'}, milk:{density:57,speed:30,size:3,glow:12,color:'#242628',bg:'#eeebe3'}, signal:{density:78,speed:66,size:2,glow:48,color:'#ff6741',bg:'#17191a'} };
let particles=[], width=0,height=0,dpr=1,pointer={x:-9999,y:-9999,active:false}, raf;
let activeCodeLanguage='javascript', codeVariants={};
const $ = id => document.getElementById(id);
function hash(seed,x,y){const n=Math.sin(seed*.0001+x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)}
function createParticleSample(seed,x,y,columns){
  const scatter=hash(seed,x,y); const band=Math.floor(y/5); const fraction=y/5-band; const blend=fraction*fraction*(3-2*fraction);
  const edgeNoise=hash(seed,401,band)*(1-blend)+hash(seed,401,band+1)*blend; const edge=columns*(.04+edgeNoise*.24);
  const edgeDensity=Math.min(1,Math.max(.08,(x-edge+2)/4)); if(scatter>.78*edgeDensity)return null;
  const period=3.8+hash(seed,x+47,y+73)*4.4; const phase=hash(seed,x+131,y+211)*Math.PI*2; const depth=.65+hash(seed,x+307,y+419)*.35;
  return (time,visibility,amplitude)=>{const breath=(1-Math.cos(time*Math.PI*2/period+phase))/2;const reveal=Math.min(1,Math.max(0,(visibility-scatter)/(1-scatter)));const size=(.36+(scatter/.78)*.22)*reveal;const strength=(24+(40*x)/Math.max(1,columns))*(.9+(breath-.5)*.7*depth*amplitude)*reveal*(.65+edgeDensity*.35);return {size,strength}};
}
function resize(){const r=canvas.getBoundingClientRect(); dpr=Math.min(1.5,window.devicePixelRatio||1); width=r.width;height=r.height;canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0); $('canvasSize').textContent=`${Math.round(width)} × ${Math.round(height)}`; build()}
function build(){particles=[];const gap=9;const maxParticles=state.lowPerf?2200:4200;const cols=Math.ceil(width/gap)+1,rows=Math.ceil(height/gap)+1;const sampleRate=Math.min(1,maxParticles/(cols*rows));for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){if(sampleRate<1&&hash(state.seed+99,x,y)>sampleRate)continue;particles.push({x,y,gx:x,gy:y})}$('particleCount').textContent=`${particles.length.toString().padStart(2,'0')},${String(particles.length*2).padStart(3,'0')} PARTICLES`}
let lastFrame=0;
function draw(t){if(t-lastFrame<33){raf=requestAnimationFrame(draw);return}lastFrame=t;ctx.clearRect(0,0,width,height);const sec=t/1000;const rgb=hexRgb(state.color);const amplitude=Math.max(.2,state.speed/42);const phase=sec*1.5;const cols=Math.ceil(width/9)+1;const gridWidth=cols*9;const flowOffset=(sec*(6+amplitude*10))%gridWidth;const left=width-(gridWidth-1);for(const p of particles){const edgeNoise=flowingNoise(state.seed,0,p.gy+phase*.45);const baseEdge=cols*(.385+(edgeNoise-.5)*.33*amplitude);const visibility=state.density/100;const recession=1-visibility;const wave=Math.sin(p.gy*.72+phase*2.1+state.seed*.01)*2.4+(flowingNoise(state.seed+19,0,p.gy+phase*1.25)-.5)*10;const edge=baseEdge+recession*(cols+5-baseEdge)+recession*Math.sin(p.gy*.7+phase)*2+wave;const distance=p.gx-edge;if(distance<-32)continue;const noise=flowingNoise(state.seed,p.gx+11,p.gy+7+phase*1.15);const tailNoise=flowingNoise(state.seed+97,p.gx+7,p.gy+31+phase*1.8);const hotEmber=distance<0&&distance>=-8&&noise>.52;const trail=distance<-8&&tailNoise>.52+(-distance/32)*.18;const ember=hotEmber||trail;const visible=distance>=0?distance>2||noise>.18:ember;if(!visible)continue;const coverage=hotEmber?Math.min(1,(noise-.52)/.48):trail?Math.max(.2,(distance+32)/24):Math.min(1,Math.max(0,distance+.5));const tailFade=ember?1:Math.min(1,.2+Math.max(0,distance)/18*.8);let alpha=(hotEmber?.2+(noise-.52)*.62:trail?.06+tailNoise*.16:(.12+(p.gx/Math.max(1,cols-1))*.24+noise*.12)*tailFade)*coverage;const px=left+((p.gx*9-flowOffset+gridWidth)%gridWidth)+4,py=p.gy*9+4;let ox=0,oy=0;const dist=Math.hypot(px-pointer.x,py-pointer.y);if(state.pointer&&pointer.active&&dist<180){const repel=state.pointerStrength/30;const force=(1-dist/180)**2*8*repel;ox=(px-pointer.x)/(dist||1)*force;oy=(py-pointer.y)/(dist||1)*force;alpha=Math.min(.96,alpha+(1-dist/180)**2*.34*repel)}const size=(hotEmber?3.4+noise*2.4:trail?2.2+tailNoise*2.2:6.6+Math.min(1,Math.max(0,distance)/18)*1.4)*(state.size/3);ctx.fillStyle=`rgba(${rgb.join(',')},${Math.max(.025,Math.min(.9,alpha))})`;ctx.fillRect(px+ox-size/2,py+oy-size/2,size,size)}raf=requestAnimationFrame(draw)}
function hexRgb(hex){const v=hex.replace('#','');return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]}
function apply(){['density','speed','size','height','glow','pointerStrength'].forEach(id=>$(id).value=state[id]);$('densityValue').textContent=state.density+'%';$('speedValue').textContent=state.speed+'%';$('sizeValue').textContent=state.size+' px';$('heightValue').textContent=state.height+' px';$('glowValue').textContent=state.glow+'%';$('pointerStrengthValue').textContent=state.pointerStrength+'%';$('particleColor').value=state.color;$('colorValue').textContent=state.color.toUpperCase();canvas.parentElement.style.background=presets[state.preset]?.bg||'#131516';canvas.parentElement.style.height=state.height+'px';document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===state.preset));resize();updateCode()}
function updateCode(){const c=`function randomAt(seed, x, y) {
  let value = seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function flowingNoise(seed, x, y) {
  const row = Math.floor(y), fraction = y - row;
  const blend = fraction * fraction * (3 - 2 * fraction);
  return randomAt(seed, x, row) * (1 - blend) + randomAt(seed, x, row + 1) * blend;
}

function burningCell(seed, x, y, columns, time, visibility = 1, amplitude = 1) {
  const phase = time * 1.5;
  const edgeNoise = flowingNoise(seed, 0, y + phase * 0.9);
  const wave = Math.sin(y * 0.72 + phase * 2.1) * 2.4;
  const edge = columns * (0.385 + (edgeNoise - 0.5) * 0.33 * amplitude) + wave;
  const distance = x - edge;
  if (distance < -32) return null;
  const noise = flowingNoise(seed, x + 11, y + 7 + phase * 1.15);
  const tailNoise = flowingNoise(seed + 97, x + 7, y + 31 + phase * 1.8);
  const hotEmber = distance < 0 && distance >= -8 && noise > 0.52;
  const trail = distance < -8 && tailNoise > 0.52 + (-distance / 32) * 0.18;
  const visible = distance >= 0 ? distance > 2 || noise > 0.18 : hotEmber || trail;
  if (!visible) return null;
  const coverage = hotEmber ? Math.min(1, (noise - 0.52) / 0.48) : trail ? Math.max(0.2, (distance + 32) / 24) : Math.min(1, Math.max(0, distance + 0.5));
  const alpha = (hotEmber ? 0.2 + (noise - 0.52) * 0.62 : trail ? 0.06 + tailNoise * 0.16 : 0.12 + x / columns * 0.24 + noise * 0.12) * coverage;
  return { alpha, size: hotEmber ? 3.5 : trail ? 3 : 7 };
}

function mountDriftfield(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const config = { color: '${state.color}', seed: 23, density: ${state.density / 100}, speed: ${state.speed / 42}, size: ${state.size / 3}, height: ${state.height}, glow: ${state.glow}, pointerStrength: ${state.pointerStrength}, pointer: ${state.pointer}, lowPerf: ${state.lowPerf}, gap: 9, ...options };
  canvas.style.height = config.height + 'px';
  let width = 0, height = 0, columns = 0, rows = 0, frame = 0, destroyed = false;
  const pointer = { x: -9999, y: -9999, active: false };
  const build = () => {
    width = canvas.clientWidth; height = canvas.clientHeight;
    const ratio = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = width * ratio; canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    columns = Math.ceil(width / config.gap) + 1; rows = Math.ceil(height / config.gap) + 1;
  };
  const paint = (time) => {
    if (destroyed) return;
    frame = requestAnimationFrame(paint);
    if (document.hidden) return;
    ctx.clearRect(0, 0, width, height);
    const [r, g, b] = config.color.slice(1).match(/.{2}/g).map(v => parseInt(v, 16));
    const gridWidth = columns * config.gap;
    const flowOffset = (time / 1000 * (6 + config.speed * 10)) % gridWidth;
    const left = width - (gridWidth - 1);
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
      if (config.lowPerf && (x + y) % 2) continue;
      const cell = burningCell(config.seed, x, y, columns, time / 1000, config.density, config.speed);
      if (!cell) continue;
      const size = cell.size * config.size;
      const px = left + ((x * config.gap - flowOffset + gridWidth) % gridWidth) + 4, py = y * config.gap + 4;
      let ox = 0, oy = 0, alpha = cell.alpha;
      const dist = Math.hypot(px - pointer.x, py - pointer.y);
      if (config.pointer && pointer.active && dist < 180) {
        const repel = config.pointerStrength / 30;
        const force = (1 - dist / 180) ** 2 * 8 * repel;
        ox = (px - pointer.x) / (dist || 1) * force;
        oy = (py - pointer.y) / (dist || 1) * force;
        alpha = Math.min(0.96, alpha + (1 - dist / 180) ** 2 * 0.34 * repel);
      }
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + Math.min(1, alpha) + ')';
      ctx.fillRect(px + ox - size / 2, py + oy - size / 2, size, size);
    }
  };
  const movePointer = event => { const rect = canvas.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.active = true; };
  const leavePointer = () => { pointer.active = false; };
  const observer = new ResizeObserver(build);
  observer.observe(canvas);
  canvas.addEventListener('pointermove', movePointer);
  canvas.addEventListener('pointerleave', leavePointer);
  build(); frame = requestAnimationFrame(paint);
  return { destroy() { destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('pointermove', movePointer); canvas.removeEventListener('pointerleave', leavePointer); } };
}

mountDriftfield(document.querySelector('#particle-canvas'));`; $('codeOutput').innerHTML=highlightCode(c);codeVariants=buildCodeVariants(c);renderModalCode()}
function highlightCode(source){return escapeHtml(source).replace(/(const|function|return|forEach|new|import|export|from)/g,'<span class=\"key\">$1</span>').replace(/(randomAt|flowingNoise|burningCell|mountDriftfield|paint|fillRect|requestAnimationFrame|useEffect|useRef|onMounted|onBeforeUnmount)/g,'<span class=\"fn\">$1</span>').replace(/(0\.\d+|\d+\.\d+)/g,'<span class=\"num\">$1</span>')}
function buildCodeVariants(source){const options=`{ color: '${state.color}', density: ${(state.density/100).toFixed(2)}, speed: ${(state.speed/42).toFixed(2)}, size: ${state.size/3}, height: ${state.height}, glow: ${state.glow}, pointerStrength: ${state.pointerStrength}, pointer: ${state.pointer}, lowPerf: ${state.lowPerf} }`;const typed=source.replace("mountDriftfield(document.querySelector('#particle-canvas'));","export { mountDriftfield };");return {javascript:source,html:`<!-- Paste into any HTML page -->
<canvas id=\"particle-canvas\" style=\"width:100%;height:${state.height}px\"></canvas>
<script>
${source}
</script>`,typescript:`// driftfield.ts · JavaScript-compatible TypeScript
export type DriftfieldOptions = Partial<{
  color: string; density: number; speed: number; size: number;
  height: number; glow: number; pointerStrength: number; pointer: boolean; lowPerf: boolean;
}>;

${typed}`,react:`// Driftfield.jsx · React integration
import { useEffect, useRef } from 'react';
import { mountDriftfield } from './driftfield.js';

export default function Driftfield(){
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const instance = mountDriftfield(canvasRef.current, ${options});
    return () => instance?.destroy();
  }, []);
  return <canvas ref={canvasRef} style={{ width: '100%', height: '${state.height}px' }} />;
}`,vue:`<!-- Driftfield.vue · Vue 3 integration -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { mountDriftfield } from './driftfield.js';

const canvas = ref(null);
let instance;
onMounted(() => { instance = mountDriftfield(canvas.value, ${options}); });
onBeforeUnmount(() => instance?.destroy());
</script>

<template><canvas ref=\"canvas\" style=\"width:100%;height:${state.height}px\"></canvas></template>`}}
function renderModalCode(){if(!$('codeModalOutput'))return;const source=codeVariants[activeCodeLanguage]||codeVariants.javascript||'';$('codeModalOutput').innerHTML=highlightCode(source);document.querySelectorAll('[data-code-language]').forEach(tab=>{const active=tab.dataset.codeLanguage===activeCodeLanguage;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active))})}
function escapeHtml(s){return s.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}
function copy(text,btn){navigator.clipboard?.writeText(text);const original=btn.innerHTML;btn.innerHTML='已复制 ✓';setTimeout(()=>btn.innerHTML=original,1400)}
['density','speed','size','height','glow','pointerStrength'].forEach(id=>$(id).addEventListener('input',e=>{state[id]=+e.target.value;apply()}));$('particleColor').addEventListener('input',e=>{state.color=e.target.value;apply()});$('pointerToggle').addEventListener('click',()=>{state.pointer=!state.pointer;$('pointerToggle').classList.toggle('on',state.pointer);updateCode()});$('perfToggle').addEventListener('click',()=>{state.lowPerf=!state.lowPerf;$('perfToggle').classList.toggle('on',state.lowPerf);build();updateCode()});document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{state.preset=b.dataset.preset;Object.assign(state,presets[state.preset]);apply()}));document.querySelectorAll('[data-preset-card]').forEach(b=>b.addEventListener('click',()=>{state.preset=b.dataset.presetCard;Object.assign(state,presets[state.preset]);apply();location.hash='playground'}));$('randomize').addEventListener('click',()=>{state.seed=Math.floor(Math.random()*10000);state.density=20+Math.floor(Math.random()*80);state.speed=Math.floor(Math.random()*80);state.size=1+Math.floor(Math.random()*6);state.glow=Math.floor(Math.random()*55);apply()});$('copyAll').addEventListener('click',()=>copy(document.getElementById('codeOutput').textContent,$('copyAll')));$('viewCode').addEventListener('click',()=>{activeCodeLanguage='javascript';renderModalCode();$('codeModal').classList.add('open');$('codeModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open');$('closeCode').focus()});const closeCode=()=>{$('codeModal').classList.remove('open');$('codeModal').setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');$('viewCode').focus()};$('closeCode').addEventListener('click',closeCode);document.querySelectorAll('[data-close-code]').forEach(el=>el.addEventListener('click',closeCode));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('codeModal').classList.contains('open'))closeCode()});$('copyModalCode').addEventListener('click',()=>copy($('codeModalOutput').textContent,$('copyModalCode')));document.querySelectorAll('[data-code-language]').forEach(tab=>tab.addEventListener('click',()=>{activeCodeLanguage=tab.dataset.codeLanguage;renderModalCode()}));$('downloadConfig').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='driftfield-config.json';a.click();URL.revokeObjectURL(a.href)});canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;pointer.active=true});canvas.addEventListener('pointerleave',()=>pointer.active=false);window.addEventListener('resize',resize);apply();requestAnimationFrame(draw);
function makeMini(el,preset){const c=document.createElement('canvas');c.width=500;c.height=260;c.style.width='100%';c.style.height='100%';el.append(c);const x=c.getContext('2d'),p=presets[preset];x.fillStyle=p.bg;x.fillRect(0,0,c.width,c.height);const rgb=hexRgb(p.color);for(let y=0;y<29;y++)for(let xx=0;xx<56;xx++){if(hash(23,xx,y)>.6)continue;const a=.15+.55*(xx/56);x.fillStyle=`rgba(${rgb.join(',')},${a})`;const s=1.2+hash(23,xx+3,y+5)*2.5;x.fillRect(xx*9+4,y*9+5,s,s)}}document.querySelectorAll('[data-mini]').forEach(el=>makeMini(el,el.dataset.mini));

// A compact dot-matrix renderer for the reference-like wordmark preview.
const heroCanvas = document.getElementById('heroParticleCanvas');
function mountHeroDotfield(el) {
  if (!el) return;
  const cx = el.getContext('2d');
  const bitmap = [
    '11110 111 1111 111 1111',
    '10000 101 1000 101 1000',
    '11110 111 1110 101 1110',
    '00001 101 1000 101 1000',
    '11110 101 1111 111 1111',
  ];
  let w=0,h=0,scale=1,gap=16,lastHeroFrame=0,items=[],mouse={x:-9999,y:-9999,active:false};
  const resizeHero=()=>{const r=el.getBoundingClientRect(); scale=Math.min(2,devicePixelRatio||1);w=r.width;h=r.height;el.width=w*scale;el.height=h*scale;cx.setTransform(scale,0,0,scale,0,0);gap=Math.max(14,Math.min(18,w/31));const rows=bitmap.length;const cols=Math.max(...bitmap.map(line=>line.length));const startX=(w-cols*gap)/2;const startY=(h-rows*gap)/2;items=[];for(let y=0;y<rows;y++){for(let x=0;x<cols;x++){const char=bitmap[y][x]||' ';const lit=char==='1';items.push({x:startX+x*gap,y:startY+y*gap,lit,phase:hash(23,x,y)*Math.PI*2,seed:hash(23,x+11,y+7)});}}};
  const paintHero=(time)=>{if(time-lastHeroFrame<33){requestAnimationFrame(paintHero);return}lastHeroFrame=time;cx.clearRect(0,0,w,h);const sec=time/1000;const rgb=hexRgb(state.color);for(const p of items){let dx=0,dy=0,boost=0;const dist=Math.hypot(p.x-mouse.x,p.y-mouse.y);if(state.pointer&&mouse.active&&dist<95){const f=(1-dist/95)**2*9*(state.pointerStrength/30);dx=(p.x-mouse.x)/(dist||1)*f;dy=(p.y-mouse.y)/(dist||1)*f;boost=(1-dist/95)**2*.25*(state.pointerStrength/30)}const breath=(1-Math.cos(sec*(state.speed/42||1)*1.5+p.phase))/2;const s=(p.lit?gap*.64+breath*1.7:gap*.53)+boost*4;const alpha=p.lit?.62+breath*.24+boost:.1+p.seed*.12+boost;cx.fillStyle=`rgba(${rgb.join(',')},${Math.min(.96,alpha)})`;cx.beginPath();cx.roundRect(p.x+dx-s/2,p.y+dy-s/2,s,s,1.5);cx.fill()}requestAnimationFrame(paintHero)};
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;mouse.active=true});el.addEventListener('pointerleave',()=>mouse.active=false);new ResizeObserver(resizeHero).observe(el);resizeHero();requestAnimationFrame(paintHero);
}
mountHeroDotfield(heroCanvas);

// Tab-card texture: port of the reference burning-texture edge + ember tail.
function randomAt(seed,x,y){let value=seed^Math.imul(x+1,374761393)^Math.imul(y+1,668265263);value=Math.imul(value^(value>>>13),1274126177);return ((value^(value>>>16))>>>0)/4294967296}
function flowingNoise(seed,x,y){const row=Math.floor(y),fraction=y-row,blend=fraction*fraction*(3-2*fraction);return randomAt(seed,x,row)*(1-blend)+randomAt(seed,x,row+1)*blend}
function mountTabTexture(el,seed,options={}){
  const cx=el.getContext('2d');let w=0,h=0,dpr=1,cols=0,rows=0,items=[],pointer={x:-9999,y:-9999,active:false},last=0;
  const resizeTab=()=>{const r=el.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(1.5,devicePixelRatio||1);el.width=w*dpr;el.height=h*dpr;cx.setTransform(dpr,0,0,dpr,0,0);const gap=9;cols=Math.ceil(w/gap)+1;rows=Math.ceil(h/gap)+1;items=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)items.push({x,y})};
  const paintTab=(time)=>{if(time-last<33){requestAnimationFrame(paintTab);return}last=time;cx.clearRect(0,0,w,h);const rgb=hexRgb(options.color||state.color);const sec=time/1000;const amplitude=Math.max(.2,options.speed??state.speed/42);const phase=sec*(1.1+amplitude*.9);const tailWidth=options.tail??52;const gridWidth=cols*9;const flowOffset=(sec*(6+amplitude*10))%gridWidth;const left=w-(gridWidth-1);for(const p of items){const edgeNoise=flowingNoise(seed,0,p.y+phase*.9);const wave=Math.sin(p.y*.72+phase*2.1+seed*.01)*2.4+(flowingNoise(seed+19,0,p.y+phase*1.25)-.5)*8;const edge=cols*(.385+(edgeNoise-.5)*.33*amplitude)+wave;const distance=p.x-edge;if(distance<-tailWidth)continue;const noise=flowingNoise(seed,p.x+11,p.y+7+phase*1.15);const tailNoise=flowingNoise(seed+97,p.x+7,p.y+31+phase*1.8);const hotEmber=distance<0&&distance>=-8&&noise>.48;const trail=distance<-8&&tailNoise>.48+(-distance/tailWidth)*.2;const ember=hotEmber||trail;const visible=distance>=0?distance>2||noise>.14:ember;if(!visible)continue;const coverage=hotEmber?Math.min(1,(noise-.48)/.52):trail?Math.max(.18,(distance+tailWidth)/(tailWidth-14)):Math.min(1,Math.max(0,distance+.5));const tailFade=ember?1:Math.min(1,.28+Math.max(0,distance)/18*.72);let alpha=(hotEmber?.28+(noise-.48)*.62:trail?.1+tailNoise*.2:(.2+(p.x/Math.max(1,cols-1))*.3+noise*.15)*tailFade)*coverage;let ox=0,oy=0;const px=left+((p.x*9-flowOffset+gridWidth)%gridWidth)+4,py=p.y*9+4;const dist=Math.hypot(px-pointer.x,py-pointer.y);if(state.pointer&&pointer.active&&dist<100){const repel=state.pointerStrength/30;const force=(1-dist/100)**2*8*repel;ox=(px-pointer.x)/(dist||1)*force;oy=(py-pointer.y)/(dist||1)*force;alpha=Math.min(.96,alpha+(1-dist/100)**2*.34*repel)}const size=hotEmber?3.8+noise*2.4:trail?2.4+tailNoise*2.8:6.8+Math.min(1,Math.max(0,distance)/18)*1.4;cx.fillStyle=`rgba(${rgb.join(',')},${Math.max(.025,Math.min(.9,alpha))})`;cx.fillRect(px+ox-size/2,py+oy-size/2,size,size)}requestAnimationFrame(paintTab)};
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;pointer.active=true});el.addEventListener('pointerleave',()=>pointer.active=false);new ResizeObserver(resizeTab).observe(el);resizeTab();requestAnimationFrame(paintTab);
}
document.querySelectorAll('[data-tab-texture]').forEach((el,index)=>mountTabTexture(el,23+index*71));
document.querySelectorAll('[data-model-texture]').forEach((el,index)=>{const isSol=el.dataset.modelTexture==='sol';mountTabTexture(el,isSol?5601:7813,{color:isSol?'#e69e4e':'#8a82f0',speed:isSol?1.45:.82,tail:isSol?42:68})});
