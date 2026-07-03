// @ts-nocheck
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';

export function initAtproto(root: HTMLElement): void {
const CFG={
  nsid:'space.eny.atpreakout.score',
  clientId:(typeof window!=='undefined'?window.location.origin:'https://eny.space')+'/atpreakout/client-metadata.json',
  handleResolver:'https://bsky.social',
  jetstream:'wss://jetstream2.us-east.bsky.network/subscribe',
  appview:'https://public.api.bsky.app'
};
const el=(id)=>root.querySelector('#'+id);
const loginBtn=el('login');
let client=null, session=null, agent=null, myDid=null;

const board={};
const profiles={};
const pdsCache=JSON.parse(localStorage.getItem('atp_pds')||'{}');
const savePds=()=>localStorage.setItem('atp_pds',JSON.stringify(pdsCache));
const saveProfiles=()=>{};

function renderBoard(){
  const b=el('board'); if(!b) return;
  const rows=Object.entries(board).map(([did,v])=>({did,...v})).sort((a,x)=>x.score-a.score).slice(0,12);
  if(!rows.length){ b.innerHTML='<div class="empty">'+(myDid?'no friends on the board yet\u2026':'sign in to see friends\u2026')+'</div>'; return; }
  b.innerHTML=rows.map((r,i)=>{
    const p=profiles[r.did]||{}, h=p.handle?('@'+p.handle):(r.did.slice(0,18)+'\u2026');
    const av=p.avatar?'<img class="av" src="'+p.avatar+'" onerror="this.style.visibility=\'hidden\'">':'<span class="av"></span>';
    return '<div class="brow'+(r.did===myDid?' me':'')+'"><span class="rk">'+(i+1)+'</span>'+av+
      '<span class="bh">'+h+'</span><span class="bs">'+r.score.toLocaleString()+'</span></div>';
  }).join('');
}
async function resolvePds(did){
  if(pdsCache[did]) return pdsCache[did];
  let doc;
  try{
    if(did.startsWith('did:plc:')){ const r=await fetch('https://plc.directory/'+did); if(!r.ok) return null; doc=await r.json(); }
    else if(did.startsWith('did:web:')){ const r=await fetch('https://'+did.slice(8).replace(/:/g,'/')+'/.well-known/did.json'); if(!r.ok) return null; doc=await r.json(); }
    else return null;
  }catch(e){ return null; }
  const svc=(doc.service||[]).find(s=>(s.id||'').endsWith('#atproto_pds')||s.type==='AtprotoPersonalDataServer');
  const ep=svc&&svc.serviceEndpoint?svc.serviceEndpoint.replace(/\/$/,''):null;
  if(ep){ pdsCache[did]=ep; savePds(); }
  return ep;
}
async function fetchScore(did){
  const pds=await resolvePds(did); if(!pds) return null;
  try{
    const r=await fetch(pds+'/xrpc/com.atproto.repo.getRecord?repo='+encodeURIComponent(did)+'&collection='+encodeURIComponent(CFG.nsid)+'&rkey=self');
    if(!r.ok) return null;
    const v=(await r.json()).value||{};
    return typeof v.score==='number'?v.score:null;
  }catch(e){ return null; }
}
async function pool(items,n,fn){ let i=0; const run=async()=>{ while(i<items.length){ await fn(items[i++]); } };
  await Promise.all(Array.from({length:Math.min(n,items.length||1)},run)); }
async function loadFriends(){
  if(!myDid){ renderBoard(); return; }
  const note=el('lbnote'); if(note) note.textContent='scanning\u2026';
  const people=[]; let cursor;
  for(let p=0;p<6;p++){
    try{
      const u=CFG.appview+'/xrpc/app.bsky.graph.getFollows?actor='+encodeURIComponent(myDid)+'&limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):'');
      const r=await fetch(u); if(!r.ok) break;
      const j=await r.json();
      for(const f of j.follows||[]){ profiles[f.did]={handle:f.handle,avatar:f.avatar||''}; people.push(f.did); }
      cursor=j.cursor; if(!cursor) break;
    }catch(e){ break; }
  }
  people.push(myDid);
  await pool([...new Set(people)],6,async(did)=>{
    const s=await fetchScore(did);
    if(typeof s==='number'){ board[did]={score:s}; renderBoard(); }
  });
  const myBest=Number(localStorage.getItem('atp_best')||0);
  if(myBest>0 && (!board[myDid]||myBest>board[myDid].score)) board[myDid]={score:myBest};
  if(note) note.textContent='friends';
  renderBoard();
}
async function initOAuth(){
  if(location.protocol!=='https:'){ loginBtn.textContent='login: https only'; loginBtn.disabled=true; return; }
  try{
    
    client=await BrowserOAuthClient.load({ clientId:CFG.clientId, handleResolver:CFG.handleResolver });
    const res=await client.init();
    if(res&&res.session) await setSession(res.session);
  }catch(e){ loginBtn.textContent='login n/a'; }
}
async function setSession(s){
  
  session=s; agent=new Agent(s); myDid=s.did;
  let handle=myDid.slice(0,12)+'\u2026';
  try{ const r=await fetch(CFG.appview+'/xrpc/app.bsky.actor.getProfile?actor='+myDid);
    if(r.ok){ const p=await r.json(); handle='@'+p.handle;
      profiles[myDid]={handle:p.handle,avatar:p.avatar||''}; saveProfiles(); } }catch(e){}
  loginBtn.textContent=handle; renderBoard(); loadFriends();
}
loginBtn.onclick=async()=>{
  if(!client) return;
  if(session){ try{ await session.signOut?.(); }catch(e){} session=agent=myDid=null; loginBtn.textContent='sign in'; for(const k in board) delete board[k]; renderBoard(); return; }
  const h=prompt('your bluesky handle (e.g. name.bsky.social)'); if(!h) return;
  try{ await client.signIn(h.trim().replace(/^@/,'')); }catch(e){ alert('sign-in failed: '+e.message); }
};
window.submitScore=async(score,wall)=>{
  const best=Number(localStorage.getItem('atp_best')||0);
  if(myDid && (!board[myDid]||score>board[myDid].score)){ board[myDid]={score}; renderBoard(); }
  if(score>best) localStorage.setItem('atp_best',score);
  if(!agent||score<=best) return;
  try{
    await agent.com.atproto.repo.putRecord({ repo:myDid, collection:CFG.nsid, rkey:'self', validate:false,
      record:{ $type:CFG.nsid, score, wall:wall||'', createdAt:new Date().toISOString() } });
  }catch(e){ console.warn('score write failed',e); }
};
renderBoard(); initOAuth();
}