// @ts-nocheck
/* ATpreakout engine: contribution graph + typeahead + breakout game.
   Root-scoped so it mounts into a React ref. Calls window.submitScore on game end. */
export function mount(root: HTMLElement): () => void {
const $=(id)=>root.querySelector('#'+id);
const mNames=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const state={did:null,pds:null,handle:null,cache:{}};

const LABELS={
  'app.bsky.feed.post':'posts & replies','app.bsky.feed.repost':'reposts','app.bsky.feed.like':'likes',
  'app.bsky.graph.follow':'follows','app.bsky.graph.block':'blocks','app.bsky.graph.list':'lists',
  'app.bsky.graph.listitem':'list items','app.bsky.graph.starterpack':'starter packs',
  'app.bsky.actor.profile':'profile','app.bsky.feed.generator':'feed generators',
  'app.bsky.feed.threadgate':'thread gates','app.bsky.feed.postgate':'post gates',
  'app.bsky.graph.verification':'verifications','chat.bsky.actor.declaration':'chat settings',
  'com.whtwnd.blog.entry':'blog posts','fyi.unravel.frontpage.post':'posts',
  'fyi.unravel.frontpage.comment':'comments','events.smokesignal.calendar.event':'events',
  'blue.linkat.board':'board','com.shinolabs.pinksea.oekaki':'art'
};
const label=n=>LABELS[n]||n.split('.').slice(-1)[0].replace(/([A-Z])/g,' $1').toLowerCase();

const GROUP_LABELS={
  'app.bsky':'bluesky','chat.bsky':'bsky chat','com.whtwnd':'whitewind','fyi.unravel':'frontpage',
  'events.smokesignal':'smoke signal','blue.linkat':'linkat','com.shinolabs':'pinksea'
};
const groupKey=n=>n.split('.').slice(0,2).join('.');
const groupName=k=>GROUP_LABELS[k]||k.split('.').reverse().join('.');
const GROUP_DOMAINS={
  'app.bsky':'bsky.app','chat.bsky':'bsky.app','com.whtwnd':'whtwnd.com','fyi.unravel':'frontpage.fyi',
  'events.smokesignal':'smokesignal.events','blue.linkat':'linkat.blue','com.shinolabs':'pinksea.art'
};
const groupDomain=k=>GROUP_DOMAINS[k]||k.split('.').reverse().join('.');
const favicon=d=>'https://www.google.com/s2/favicons?domain='+d+'&sz=64';

async function resolveDid(handle){
  const r=await fetch('https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle='+encodeURIComponent(handle));
  if(!r.ok) throw new Error('handle not found');
  return (await r.json()).did;
}
async function resolvePds(did){
  let doc;
  if(did.startsWith('did:plc:')){
    const r=await fetch('https://plc.directory/'+did);
    if(!r.ok) throw new Error('could not resolve DID document');
    doc=await r.json();
  }else if(did.startsWith('did:web:')){
    const r=await fetch('https://'+did.slice(8).replace(/:/g,'/')+'/.well-known/did.json');
    if(!r.ok) throw new Error('could not resolve did:web');
    doc=await r.json();
  }else throw new Error('unsupported DID type');
  const svc=(doc.service||[]).find(s=>(s.id||'').endsWith('#atproto_pds')||s.type==='AtprotoPersonalDataServer');
  if(!svc||!svc.serviceEndpoint) throw new Error('no PDS endpoint found');
  return svc.serviceEndpoint.replace(/\/$/,'');
}
async function describeCollections(pds,did){
  const r=await fetch(pds+'/xrpc/com.atproto.repo.describeRepo?repo='+encodeURIComponent(did));
  if(!r.ok) throw new Error('could not read repo');
  return (await r.json()).collections||[];
}
async function listCounts(pds,did,collection,cutoff){
  const counts={}; let cursor,pages=0,total=0;
  do{
    const url=pds+'/xrpc/com.atproto.repo.listRecords?repo='+encodeURIComponent(did)+
      '&collection='+collection+'&limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):'');
    const r=await fetch(url); if(!r.ok) break;
    const data=await r.json(); let stop=false;
    for(const rec of data.records||[]){
      const iso=rec.value&&rec.value.createdAt; if(!iso) continue;
      const d=new Date(iso); if(d<cutoff){stop=true;break;}
      counts[key(d)]=(counts[key(d)]||0)+1; total++;
    }
    cursor=data.cursor; pages++; if(stop) break;
  }while(cursor && pages<60);
  return {counts,total};
}

async function loadAccount(handle){
  const status=$('status'), btn=$('go');
  if(G.stop) G.stop(); $('game').style.display='none';
  $('card').style.display='none'; $('cols').innerHTML=''; $('cols').style.display='flex';
  $('colhead').style.display='none'; $('playbar').style.display='none';
  btn.disabled=true; state.cache={};
  status.className='status'; status.innerHTML='resolving @'+handle+'<span class="blink"></span>';
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-365);
  let slowMode=false;
  const slowTimer=setTimeout(()=>{ slowMode=true;
    status.innerHTML='damn you have been active in the atmosphere!<span class="blink"></span>'; },8000);
  try{
    const did=await resolveDid(handle); const pds=await resolvePds(did);
    state.did=did; state.pds=pds; state.handle=handle;
    const collections=await describeCollections(pds,did);
    if(!collections.length) throw new Error('this repo has no records');
    let done=0;
    const results=await Promise.all(collections.map(async nsid=>{
      const {counts,total}=await listCounts(pds,did,nsid,cutoff);
      state.cache[nsid]=counts; done++;
      if(!slowMode) status.innerHTML='scanning collections '+done+'/'+collections.length+'<span class="blink"></span>';
      return {nsid,total};
    }));
    results.sort((a,b)=>b.total-a.total);
    buildToggles(results);
    status.style.display='none';
    $('colhead').style.display='flex';
    aggregate();
    loaded=true; $('go').textContent='new handle';
  }catch(e){
    status.className='status err'; status.textContent='! '+e.message+'. check the handle and retry.';
  }finally{ clearTimeout(slowTimer); btn.disabled=false; }
}

function buildToggles(results){
  const box=$('cols'); box.innerHTML='';
  const groups={};
  for(const r of results){
    const g=groupKey(r.nsid);
    (groups[g]=groups[g]||{items:[],total:0});
    groups[g].items.push(r); groups[g].total+=r.total;
  }
  const order=Object.keys(groups).sort((a,b)=>groups[b].total-groups[a].total);
  order.forEach((g,gi)=>{
    const wrap=document.createElement('div'); wrap.className='group collapsed';
    const head=document.createElement('div'); head.className='group-head';
    head.innerHTML='<span class="chev">&#9662;</span>'+
      '<img class="gicon" src="'+favicon(groupDomain(g))+'" onerror="this.style.visibility=\'hidden\'" alt="">'+
      '<span class="gname">'+groupName(g)+'</span>'+
      '<span class="gcount">'+groups[g].total.toLocaleString()+'</span>'+
      '<span class="spacer"></span>'+
      '<input type="checkbox" class="gtoggle" title="toggle all">';
    const chips=document.createElement('div'); chips.className='chips';
    for(const {nsid,total} of groups[g].items){
      const lab=document.createElement('label'); if(total===0) lab.className='off';
      lab.innerHTML='<input type="checkbox" '+(total>0?'checked':'')+(total===0?' disabled':'')+'>'+
        '<span>'+label(nsid)+'</span><span class="badge">'+total.toLocaleString()+'</span>';
      const inp=lab.querySelector('input'); inp.dataset.nsid=nsid;
      inp.addEventListener('change',aggregate);
      chips.appendChild(lab);
    }
    head.onclick=e=>{ if(e.target.classList.contains('gtoggle')) return; wrap.classList.toggle('collapsed'); };
    const gt=head.querySelector('.gtoggle');
    gt.onclick=e=>e.stopPropagation();
    gt.onchange=()=>{ chips.querySelectorAll('input:not(:disabled)').forEach(i=>i.checked=gt.checked); aggregate(); };
    wrap.appendChild(head); wrap.appendChild(chips); box.appendChild(wrap);
  });
}

function refreshGroupChecks(){
  root.querySelectorAll('#cols .group').forEach(gr=>{
    const ins=[...gr.querySelectorAll('.chips input:not(:disabled)')];
    const gt=gr.querySelector('.gtoggle'); if(!gt) return;
    const on=ins.filter(i=>i.checked).length;
    gt.checked = on>0 && on===ins.length;
    gt.indeterminate = on>0 && on<ins.length;
  });
}

function aggregate(){
  const merged={}, detail={};
  root.querySelectorAll('#cols .chips input:checked').forEach(cb=>{
    const nsid=cb.dataset.nsid, c=state.cache[nsid]||{};
    for(const k in c){ merged[k]=(merged[k]||0)+c[k];
      (detail[k]=detail[k]||{})[nsid]=(detail[k][nsid]||0)+c[k]; }
  });
  state.detail=detail;
  render(merged);
  refreshGroupChecks();
}

function render(counts){
  const today=new Date(); today.setHours(0,0,0,0);
  const start=new Date(today); start.setDate(start.getDate()-364);
  start.setDate(start.getDate()-start.getDay());
  const colCount=Math.ceil(((today-start)/86400000+1)/7);
  const grid=$('grid'), months=$('months'); grid.innerHTML=''; months.innerHTML='';
  const vals=Object.values(counts).filter(n=>n>0);
  const max=Math.max(1,...vals);
  const lvl=n=>n===0?0:n<=max*0.25?1:n<=max*0.5?2:n<=max*0.75?3:4;
  let lastMonth=-1;
  for(let c=0;c<colCount;c++){
    const cd=new Date(start); cd.setDate(start.getDate()+c*7);
    const lbl=document.createElement('span');
    if(cd.getMonth()!==lastMonth && cd.getDate()<=7){lbl.textContent=mNames[cd.getMonth()];lastMonth=cd.getMonth();}
    months.appendChild(lbl);
  }
  let total=0; state.bricks=[]; state.colCount=colCount;
  for(let c=0;c<colCount;c++)for(let r=0;r<7;r++){
    const d=new Date(start); d.setDate(start.getDate()+c*7+r);
    const cell=document.createElement('div'); cell.className='cell';
    cell.style.animationDelay=(c*9)+'ms';
    if(d<=today){
      const n=counts[key(d)]||0; total+=n;
      const l=lvl(n); if(l){cell.classList.add('l'+l); state.bricks.push({c,r,l,key:key(d)});}
      cell.title=n+(n===1?' record':' records')+' · '+d.toDateString();
    }else cell.style.visibility='hidden';
    grid.appendChild(cell);
  }
  $('total').textContent=total.toLocaleString()+' records in the last year · @'+state.handle;
  $('card').style.display='block';
  $('playbar').style.display='flex';
}

const GBRICK={1:'#475569',2:'#64748b',3:'#94a3b8',4:'#e2e8f0'};
const GPTS={1:1,2:2,3:3,4:5};
const iconCache={};
function getIcon(nsid){ const dom=groupDomain(groupKey(nsid));
  if(!iconCache[dom]){ const im=new Image(); im.src=favicon(dom); iconCache[dom]=im; } return iconCache[dom]; }
let raf=null, mute=false, musicOn=true, actx=null;
const G={W:760,H:330,gap:2,run:false,stop:null,keyhandler:null};

function beep(f,d){
  if(mute) return;
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(), g=actx.createGain();
    o.type='square'; o.frequency.value=f; o.connect(g); g.connect(actx.destination);
    const n=actx.currentTime; g.gain.setValueAtTime(.05,n);
    g.gain.exponentialRampToValueAtTime(.0001,n+(d||.06));
    o.start(n); o.stop(n+(d||.06));
  }catch(e){}
}

function shortLabel(nsid){ return (LABELS[nsid]||label(nsid)).replace(' & replies',''); }
function fmtDate(k){ const p=k.split('-'); return mNames[(+p[1])-1]+' '+(+p[2]); }
function logHit(b){
  const det=state.detail[b.key]||{};
  const parts=Object.keys(det).map(n=>det[n]+' '+shortLabel(n));
  const line=parts.join(' \u00b7 ')||'record';
  const el=document.createElement('div'); el.className='lg';
  el.innerHTML='<span class="lgd">'+fmtDate(b.key)+'</span><span class="lgb">'+line+'</span><span class="lgp">+'+(GPTS[b.l]*10)+'</span>';
  const log=$('log'); if(log.firstChild&&log.firstChild.className==='empty') log.innerHTML='';
  log.insertBefore(el,log.firstChild);
  while(log.children.length>60) log.removeChild(log.lastChild);
}
function clearLog(){ $('log').innerHTML='<div class="empty">break a block to log it\u2026</div>'; }

function startGame(){
  const cv=$('cv'); cv.width=G.W; cv.height=G.H;
  const ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
  const cols=state.colCount||53;
  const cell=Math.max(6,Math.floor((G.W-(cols-1)*G.gap)/cols));
  const fieldW=cols*cell+(cols-1)*G.gap, ox=Math.max(0,(G.W-fieldW)/2), oy=22;
  const bricks=state.bricks.map(b=>({x:ox+b.c*(cell+G.gap),y:oy+b.r*(cell+G.gap),w:cell,h:cell,l:b.l,alive:true,key:b.key}));
  let remaining=bricks.length;
  clearLog();
  const parts=[];
  { const s=new Set(); Object.values(state.detail||{}).forEach(o=>Object.keys(o).forEach(n=>s.add(n))); s.forEach(getIcon); }
  function spawn(b){
    let ns=Object.keys(state.detail[b.key]||{}); if(!ns.length) ns=['app.bsky.feed.post'];
    ns.slice(0,4).forEach(nsid=>parts.push({img:getIcon(nsid),x:b.x+b.w/2,y:b.y+b.h/2,
      vx:(Math.random()-.5)*2.6,vy:-1.2-Math.random()*1.6,rot:0,vr:(Math.random()-.5)*.32,life:80+Math.random()*30,s:16}));
  }
  function stepParts(){
    for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.vy+=.16; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; p.life--;
      if(p.life<=0||p.y>G.H+24) parts.splice(i,1); }
  }
  function drawParts(){
    for(const p of parts){ const im=p.img; if(!im||!im.complete||!im.naturalWidth) continue;
      ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,p.life/28)); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.drawImage(im,-p.s/2,-p.s/2,p.s,p.s); ctx.restore(); }
    ctx.globalAlpha=1;
  }
  const pad={w:88,h:10,x:G.W/2-44,y:G.H-26};
  const ball={x:G.W/2,y:pad.y-8,vx:0,vy:0,r:4,size:8,stuck:true};
  let score=0, lives=3, phase='ready';
  const baseSpeed=4.5;

  function launch(){
    if(phase==='ready'){ ball.stuck=false; const a=(-Math.PI/2)+(Math.random()*.6-.3);
      ball.vx=Math.cos(a)*baseSpeed; ball.vy=Math.sin(a)*baseSpeed; phase='playing'; }
    else if(phase==='over'||phase==='won'){ bricks.forEach(b=>b.alive=true); remaining=bricks.length;
      score=0; lives=3; ball.stuck=true; ball.x=pad.x+pad.w/2; ball.y=pad.y-8; ball.vx=ball.vy=0; phase='ready'; clearLog(); parts.length=0; }
  }
  function setPaddle(clientX){ const r=cv.getBoundingClientRect();
    pad.x=Math.max(0,Math.min(G.W-pad.w,(clientX-r.left)/r.width*G.W-pad.w/2));
    if(ball.stuck) ball.x=pad.x+pad.w/2; }
  cv.onpointermove=e=>setPaddle(e.clientX);
  cv.onpointerdown=e=>{ setPaddle(e.clientX); launch(); };
  G.keyhandler=e=>{
    if(e.key===' '){ e.preventDefault(); launch(); }
    if(e.key==='ArrowLeft'){ pad.x=Math.max(0,pad.x-28); if(ball.stuck)ball.x=pad.x+pad.w/2; }
    if(e.key==='ArrowRight'){ pad.x=Math.min(G.W-pad.w,pad.x+28); if(ball.stuck)ball.x=pad.x+pad.w/2; }
  };
  window.addEventListener('keydown',G.keyhandler);
  function hud(){ $('g-score').textContent=score.toLocaleString(); $('g-lives').textContent='x'+lives; }

  function update(){
    if(phase!=='playing') return;
    ball.x+=ball.vx; ball.y+=ball.vy;
    if(ball.x<ball.r){ball.x=ball.r;ball.vx=-ball.vx;beep(220);}
    if(ball.x>G.W-ball.r){ball.x=G.W-ball.r;ball.vx=-ball.vx;beep(220);}
    if(ball.y<ball.r){ball.y=ball.r;ball.vy=-ball.vy;beep(220);}
    if(ball.vy>0 && ball.y+ball.r>=pad.y && ball.y+ball.r<=pad.y+pad.h+8 && ball.x>=pad.x && ball.x<=pad.x+pad.w){
      ball.y=pad.y-ball.r; const hit=(ball.x-(pad.x+pad.w/2))/(pad.w/2);
      const ang=(-Math.PI/2)+hit*(Math.PI/3), sp=Math.hypot(ball.vx,ball.vy)||baseSpeed;
      ball.vx=Math.cos(ang)*sp; ball.vy=Math.sin(ang)*sp; beep(300);
    }
    for(const b of bricks){ if(!b.alive) continue;
      if(ball.x+ball.r>b.x && ball.x-ball.r<b.x+b.w && ball.y+ball.r>b.y && ball.y-ball.r<b.y+b.h){
        b.alive=false; remaining--; score+=GPTS[b.l]*10; beep(480+b.l*120,.05); logHit(b); spawn(b);
        const oxv=Math.min(ball.x+ball.r,b.x+b.w)-Math.max(ball.x-ball.r,b.x);
        const oyv=Math.min(ball.y+ball.r,b.y+b.h)-Math.max(ball.y-ball.r,b.y);
        if(oxv<oyv) ball.vx=-ball.vx; else ball.vy=-ball.vy;
        if(remaining<=0){ phase='won'; beep(700,.12); setTimeout(()=>beep(950,.14),120);
          window.submitScore&&window.submitScore(score,state.handle); }
        break;
      }
    }
    if(ball.y-ball.r>G.H){ lives--; beep(120,.25);
      if(lives<=0){ phase='over'; window.submitScore&&window.submitScore(score,state.handle); }
      else { ball.stuck=true; ball.x=pad.x+pad.w/2; ball.y=pad.y-8; ball.vx=ball.vy=0; phase='ready'; } }
    hud();
  }
  function txt(s,sub){ ctx.textAlign='center'; ctx.fillStyle='#e2e8f0'; ctx.font='14px "Press Start 2P"';
    ctx.fillText(s,G.W/2,G.H/2-4);
    if(sub){ ctx.fillStyle='#94a3b8'; ctx.font='18px VT323'; ctx.fillText(sub,G.W/2,G.H/2+22); }
    ctx.textAlign='left'; }
  function draw(){
    ctx.clearRect(0,0,G.W,G.H);
    for(const b of bricks){ if(!b.alive) continue;
      ctx.fillStyle=GBRICK[b.l]; ctx.fillRect(b.x,b.y,b.w,b.h);
      ctx.fillStyle='rgba(0,0,0,.22)'; ctx.fillRect(b.x,b.y+b.h-2,b.w,2); }
    ctx.fillStyle='#e879f9'; ctx.fillRect(pad.x,pad.y,pad.w,pad.h);
    ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(pad.x,pad.y,pad.w,2);
    ctx.fillStyle='#f0abfc'; ctx.fillRect(ball.x-ball.size/2,ball.y-ball.size/2,ball.size,ball.size);
    drawParts();
    if(phase==='ready') txt('click to launch','move the paddle');
    if(phase==='over') txt('game over','click to retry');
    if(phase==='won') txt('cleared!','click to replay');
  }
  function loop(){ if(!G.run) return; update(); stepParts(); draw(); raf=requestAnimationFrame(loop); }
  hud(); G.run=true; loop();
  G.stop=()=>{ G.run=false; if(raf)cancelAnimationFrame(raf);
    window.removeEventListener('keydown',G.keyhandler); cv.onpointermove=cv.onpointerdown=null; };
}

function showGame(){
  if(!state.bricks||!state.bricks.length) return;
  $('card').style.display='none'; $('colhead').style.display='none';
  $('cols').style.display='none'; $('playbar').style.display='none';
  $('game').style.display='block'; startGame();
  const bgm=$('bgm'); bgm.volume=.5; if(musicOn) bgm.play().catch(()=>{});
  $('game').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function showGraph(){
  if(G.stop) G.stop();
  const b=$('bgm'); if(b) b.pause();
  $('game').style.display='none';
  $('card').style.display='block'; $('colhead').style.display='flex';
  $('cols').style.display='flex'; $('playbar').style.display='flex';
}
$('play').onclick=showGame;
$('back').onclick=showGraph;
$('mute').onclick=()=>{ mute=!mute; $('mute').textContent=mute?'sound: off':'sound: on'; };
$('music').onclick=()=>{ musicOn=!musicOn; const b=$('bgm');
  if(musicOn) b.play().catch(()=>{}); else b.pause();
  $('music').textContent=musicOn?'music: on':'music: off'; };

function go(){
  let h=$('handle').value.trim().replace(/^@/,''); if(!h) return;
  if(!h.includes('.')) h+='.bsky.social';
  loadAccount(h);
}
let loaded=false;
function resetToStart(){
  if(G.stop) G.stop();
  const b=$('bgm'); if(b) b.pause();
  $('game').style.display='none'; $('card').style.display='none';
  $('colhead').style.display='none'; $('playbar').style.display='none';
  $('cols').innerHTML=''; $('cols').style.display='flex';
  const s=$('status'); s.style.display='block'; s.className='status';
  s.innerHTML='enter a handle to scan its repo<span class="blink"></span>';
  state.cache={}; state.bricks=[]; state.colCount=0;
  loaded=false; $('go').textContent='load';
  $('handle').value=''; $('handle').focus();
}
function handleGo(){ if(loaded) resetToStart(); else go(); }
$('go').onclick=handleGo;

const acEl=$('ac'); let acTimer=null, acItems=[], acHot=-1;
function hideAc(){ acEl.classList.remove('open'); acEl.innerHTML=''; acItems=[]; acHot=-1; }
function selectHandle(h){ $('handle').value=h; hideAc(); loaded=false; $('go').textContent='load'; go(); }
async function searchActors(q){
  try{
    const r=await fetch('https://public.api.bsky.app/xrpc/app.bsky.actor.searchActorsTypeahead?q='+encodeURIComponent(q)+'&limit=6');
    if(!r.ok) return [];
    return (await r.json()).actors||[];
  }catch(e){ return []; }
}
function renderAc(actors){
  if(!actors.length){ hideAc(); return; }
  acItems=actors; acHot=-1;
  acEl.innerHTML=actors.map(a=>(
    '<div class="item" data-h="'+a.handle+'">'+
    (a.avatar?'<img class="av" src="'+a.avatar+'" onerror="this.style.visibility=\'hidden\'" alt="">':'<span class="av"></span>')+
    '<span class="txt"><span class="nm">'+(a.displayName||a.handle)+'</span><span class="hd">@'+a.handle+'</span></span></div>'
  )).join('');
  [...acEl.children].forEach((el,i)=>{ el.onmousedown=e=>{ e.preventDefault(); selectHandle(acItems[i].handle); }; });
  acEl.classList.add('open');
}
$('handle').addEventListener('input',()=>{
  if(loaded){ loaded=false; $('go').textContent='load'; }
  const q=$('handle').value.trim().replace(/^@/,'');
  clearTimeout(acTimer);
  if(q.length<2){ hideAc(); return; }
  acTimer=setTimeout(async()=>{
    const actors=await searchActors(q);
    if($('handle').value.trim().replace(/^@/,'')!==q) return;
    renderAc(actors);
  },180);
});
$('handle').addEventListener('blur',()=>setTimeout(hideAc,120));
$('handle').addEventListener('keydown',e=>{
  const open=acEl.classList.contains('open');
  if(e.key==='Escape'){ hideAc(); return; }
  if(open && (e.key==='ArrowDown'||e.key==='ArrowUp')){
    e.preventDefault();
    acHot=(acHot+(e.key==='ArrowDown'?1:-1)+acItems.length)%acItems.length;
    [...acEl.children].forEach((c,i)=>c.classList.toggle('hot',i===acHot));
    return;
  }
  if(e.key==='Enter'){
    if(open && acHot>=0){ selectHandle(acItems[acHot].handle); }
    else { hideAc(); handleGo(); }
  }
});
$('selall').onclick=()=>{root.querySelectorAll('#cols .chips input:not(:disabled)').forEach(c=>c.checked=true);aggregate();};
$('selnone').onclick=()=>{root.querySelectorAll('#cols .chips input').forEach(c=>c.checked=false);aggregate();};

  return () => {
    const a = root.querySelector('#bgm') as HTMLAudioElement | null;
    if (a) a.pause();
  };
}
