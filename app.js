const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const state = { density: 68, speed: 42, size: 3, glow: 24, color: '#f5f0e8', pointer: true, lowPerf: false, seed: 23, preset: 'midnight' };
const presets = { midnight:{density:68,speed:42,size:3,glow:24,color:'#f5f0e8',bg:'#131516'}, milk:{density:57,speed:30,size:3,glow:12,color:'#242628',bg:'#eeebe3'}, signal:{density:78,speed:66,size:2,glow:48,color:'#ff6741',bg:'#17191a'} };
let particles=[], width=0,height=0,dpr=1,pointer={x:-9999,y:-9999,active:false}, raf;
const $ = id => document.getElementById(id);
function hash(seed,x,y){const n=Math.sin(seed*.0001+x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)}
function resize(){const r=canvas.getBoundingClientRect(); dpr=Math.min(1.5,window.devicePixelRatio||1); width=r.width;height=r.height;canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0); $('canvasSize').textContent=`${Math.round(width)} × ${Math.round(height)}`; build()}
function build(){particles=[]; const gap=state.lowPerf?12:10; const maxParticles=state.lowPerf?1400:2800; const cols=Math.ceil(width/gap)+1, rows=Math.ceil(height/gap)+1; outer: for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){const edge=cols*(.04+hash(state.seed,401,Math.floor(y/5))*.24);const edgeDensity=Math.min(1,Math.max(.08,(x-edge+2)/4));const scatter=hash(state.seed,x,y);if(scatter>(.22+state.density/100*.78)*edgeDensity)continue;particles.push({x:x*gap+4,y:y*gap+4,scatter,phase:hash(state.seed,x+131,y+211)*Math.PI*2,period:3.8+hash(state.seed,x+47,y+73)*4.4,depth:.65+hash(state.seed,x+307,y+419)*.35});if(particles.length>=maxParticles)break outer} $('particleCount').textContent=`${particles.length.toString().padStart(2,'0')},${String(particles.length*2).padStart(3,'0')} PARTICLES`}
let lastFrame=0;
function draw(t){if(t-lastFrame<33){raf=requestAnimationFrame(draw);return}lastFrame=t;ctx.clearRect(0,0,width,height);const sec=t/1000;const rgb=hexRgb(state.color);let lastBucket=-1;ctx.shadowBlur=0; for(const p of particles){const breath=(1-Math.cos(sec*state.speed/42*Math.PI*2/p.period+p.phase))/2;let offsetX=0,offsetY=0;if(state.pointer&&pointer.active){const dx=p.x-pointer.x,dy=p.y-pointer.y,dist=Math.hypot(dx,dy);if(dist<180){const force=(1-dist/180)**2*8;offsetX=(dx/dist||0)*force;offsetY=(dy/dist||0)*force}}const alpha=(.18+.46*(p.x/Math.max(width,1)/1.1))*(.88+(breath-.5)*.7*p.depth*(state.speed/100));const bucket=Math.round(Math.max(.03,Math.min(.9,alpha))*12)/12;if(bucket!==lastBucket){ctx.fillStyle=`rgba(${rgb.join(',')},${bucket})`;lastBucket=bucket}const s=state.size*(.42+(p.scatter/.78)*.2)*(0.9+breath*.12);ctx.fillRect(p.x+offsetX-s/2,p.y+offsetY-s/2,s,s)}raf=requestAnimationFrame(draw)}
function hexRgb(hex){const v=hex.replace('#','');return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]}
function apply(){['density','speed','size','glow'].forEach(id=>$(id).value=state[id]);$('densityValue').textContent=state.density+'%';$('speedValue').textContent=state.speed+'%';$('sizeValue').textContent=state.size+' px';$('glowValue').textContent=state.glow+'%';$('particleColor').value=state.color;$('colorValue').textContent=state.color.toUpperCase();canvas.parentElement.style.background=presets[state.preset]?.bg||'#131516';document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===state.preset));build();updateCode()}
function updateCode(){const c=`function mountDriftfield(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const config = { color: '${state.color}', density: ${state.density / 100}, speed: ${state.speed / 100}, size: ${state.size}, gap: 9, ...options };
  let width, height, particles = [];

  const random = (seed, x, y) => {
    const value = Math.sin(seed * 0.0001 + x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const build = () => {
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = width * devicePixelRatio; canvas.height = height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    particles = [];
    for (let y = 0; y < height / config.gap; y++) {
      for (let x = 0; x < width / config.gap; x++) {
        const noise = random(23, x, y);
        if (noise > config.density) continue;
        particles.push({ x: x * config.gap, y: y * config.gap, phase: noise * 6.28 });
      }
    }
  };

  const paint = (time) => {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      const breath = (1 - Math.cos(time * 0.001 * config.speed + particle.phase)) / 2;
      ctx.globalAlpha = 0.2 + breath * 0.45;
      ctx.fillStyle = config.color;
      ctx.fillRect(particle.x, particle.y, config.size, config.size);
    });
    requestAnimationFrame(paint);
  };

  new ResizeObserver(build).observe(canvas);
  build(); requestAnimationFrame(paint);
}

mountDriftfield(document.querySelector('#particle-canvas'));`; $('codeOutput').innerHTML=escapeHtml(c).replace(/(const|function|return|forEach|new)/g,'<span class="key">$1</span>').replace(/(random|mountDriftfield|paint|fillRect|requestAnimationFrame)/g,'<span class="fn">$1</span>').replace(/(0\.\d+|\d+\.\d+)/g,'<span class="num">$1</span>')}
function escapeHtml(s){return s.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}
function copy(text,btn){navigator.clipboard?.writeText(text);const original=btn.innerHTML;btn.innerHTML='已复制 ✓';setTimeout(()=>btn.innerHTML=original,1400)}
['density','speed','size','glow'].forEach(id=>$(id).addEventListener('input',e=>{state[id]=+e.target.value;apply()}));$('particleColor').addEventListener('input',e=>{state.color=e.target.value;apply()});$('pointerToggle').addEventListener('click',()=>{state.pointer=!state.pointer;$('pointerToggle').classList.toggle('on',state.pointer)});$('perfToggle').addEventListener('click',()=>{state.lowPerf=!state.lowPerf;$('perfToggle').classList.toggle('on',state.lowPerf);build()});document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{state.preset=b.dataset.preset;Object.assign(state,presets[state.preset]);apply()}));document.querySelectorAll('[data-preset-card]').forEach(b=>b.addEventListener('click',()=>{state.preset=b.dataset.presetCard;Object.assign(state,presets[state.preset]);apply();location.hash='playground'}));$('randomize').addEventListener('click',()=>{state.seed=Math.floor(Math.random()*10000);state.density=20+Math.floor(Math.random()*80);state.speed=Math.floor(Math.random()*80);state.size=1+Math.floor(Math.random()*6);state.glow=Math.floor(Math.random()*55);apply()});$('copyAll').addEventListener('click',()=>copy(document.getElementById('codeOutput').textContent,$('copyAll')));$('downloadConfig').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='driftfield-config.json';a.click();URL.revokeObjectURL(a.href)});canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;pointer.active=true});canvas.addEventListener('pointerleave',()=>pointer.active=false);window.addEventListener('resize',resize);resize();updateCode();requestAnimationFrame(draw);
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
  const paintHero=(time)=>{if(time-lastHeroFrame<33){requestAnimationFrame(paintHero);return}lastHeroFrame=time;cx.clearRect(0,0,w,h);const sec=time/1000;for(const p of items){let dx=0,dy=0;const dist=Math.hypot(p.x-mouse.x,p.y-mouse.y);if(mouse.active&&dist<95){const f=(1-dist/95)**2*9;dx=(p.x-mouse.x)/(dist||1)*f;dy=(p.y-mouse.y)/(dist||1)*f}const breath=(1-Math.cos(sec*(state.speed/42||1)*1.5+p.phase))/2;const s=p.lit?gap*.64+breath*1.7:gap*.53;cx.fillStyle=p.lit?`rgba(172,137,216,${.62+breath*.24})`:`rgba(196,183,220,${.1+p.seed*.12})`;cx.beginPath();cx.roundRect(p.x+dx-s/2,p.y+dy-s/2,s,s,1.5);cx.fill()}requestAnimationFrame(paintHero)};
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;mouse.active=true});el.addEventListener('pointerleave',()=>mouse.active=false);new ResizeObserver(resizeHero).observe(el);resizeHero();requestAnimationFrame(paintHero);
}
mountHeroDotfield(heroCanvas);
