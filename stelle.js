/* Studio delle giocate con la stella ★: salvataggio del segno e verifica sui risultati reali (schede Verifica e Test passato). */
(()=>{
const pc=x=>x==null?'–':(x*100).toFixed(0)+'%';
const tb=(h,rows)=>`<div class=sc><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.join('')}</table></div>`;

// segna con la stella le previsioni che lo sono prima della partita (l'ultima versione prima del via)
function logStars(){const G=window.__giocate,N=window.__novita;if(!G||!N)return;
  const SK=new Set(N.nightBest(N.plays()).map(x=>`${x.p.n}|${x.s}|${x.p.g.id}`)),pr=JSON.parse(localStorage.getItem('preds')||'{}');let ch=0;
  for(const p of G.pool()){if(p.min<18||new Date(p.g.date)<=Date.now())continue;
    for(const s of G.STATS){const k=`${p.g.id}|${p.n}|${s}`,star=SK.has(`${p.n}|${s}|${p.g.id}`)?1:0,old=pr[k];
      if(!star&&(!old||old[3]!==1))continue;
      const e=G.est(p,s);if(!e||e.base<G.MINB[s])continue;
      pr[k]=[+G.pth(e.p,e.sd,e.base).toFixed(3),+e.base.toFixed(2),+e.p.toFixed(2),star];ch++}}
  if(ch)try{localStorage.setItem('preds',JSON.stringify(pr))}catch(x){}}
const iv=setInterval(()=>{if(typeof R!=='undefined'&&R.length&&T.games.length&&window.__novita){clearInterval(iv);setTimeout(logStars,1500)}},700);
setTimeout(()=>clearInterval(iv),40000);

// scheda Verifica: come sono andate le giocate con la stella
function starCard(){
  const pr={...(window.SP||{}),...JSON.parse(localStorage.getItem('preds')||'{}')};
  const mk=()=>({n:0,h:0,c:0}),S=mk(),O=mk(),bins=[[.6,.65],[.65,.7],[.7,.8],[.8,1.01]].map(b=>({b,...mk()})),by={};let pend=0;
  const add=(o,c,h)=>{o.n++;o.c+=c;if(h)o.h++};
  for(const k in pr){const[gid,n,s]=k.split('|'),e=pr[k],P=e[0],base=e[1],star=e[3]===1,c=Math.max(P,1-P),row=(byP[n]||[]).find(r=>r[0]===gid);
    if(!row){if(star)pend++;continue}
    const h=(F[s](row)>base)===(P>=.5);
    if(star){add(S,c,h);add(bins.find(x=>c>=x.b[0]&&c<x.b[1])||bins[3],c,h);add(by[s]??=mk(),c,h)}else if(c>=.6)add(O,c,h)}
  const f=o=>`<td>${o.n}</td><td>${o.n?pc(o.c/o.n):'–'}</td><td><b>${o.n?pc(o.h/o.n):'–'}</b></td>`;
  return`<div class=card><h3>★ Giocate con la stella</h3>
  <div class="sm mu">Le giocate segnate con la stella (le migliori della serata) vengono salvate prima della partita e controllate a partita finita, separate dalle altre. Il confronto serve a capire se la stella indica davvero giocate più affidabili.</div>
  <p class=sm>Con la stella ancora in attesa del risultato: ${pend}</p>
  ${tb(['Gruppo','Verificate','Confidenza media','Successi'],[`<tr><td><b>★ Con la stella</b></td>${f(S)}</tr>`,`<tr><td>Senza stella (probabilità ≥ 60%)</td>${f(O)}</tr>`])}
  <h4>Per fascia di confidenza (solo stelle)</h4>${tb(['Fascia','Verificate','Confidenza media','Successi'],bins.map(b=>`<tr><td>${(b.b[0]*100).toFixed(0)}–${Math.min(100,b.b[1]*100).toFixed(0)}%</td>${f(b)}</tr>`))}
  <h4>Per tipo di giocata (solo stelle)</h4>${tb(['Giocata','Verificate','Confidenza media','Successi'],Object.entries(by).map(([s,o])=>`<tr><td>${(window.__giocate&&window.__giocate.LBL[s])||s}</td>${f(o)}</tr>`))}</div>`}

// scheda Test passato: le stelle ricostruite sulle partite già giocate
function btCard(s){
  const f=o=>`<td>${o.n}</td><td>${pc(o.hit0)}</td><td><b>${pc(o.hit1)}</b></td>`;
  return`<div class=card><h3>★ Giocate con la stella nel passato</h3>
  <div class="sm mu">Per ogni giornata del test, le giocate che avrebbero avuto la stella (stessi criteri del sito: probabilità almeno 60%, 10 partite di dati, un motivo concreto, una per giocatore, le prime 8). Confronto con le altre giocate sopra il 60%. "Rispetto alla linea indicativa" è la misura più realistica, ma la linea vera del bookmaker è più precisa.</div>
  ${tb(['Gruppo','Giocate','Successi rispetto alla media','Successi rispetto alla linea indicativa'],[`<tr><td><b>★ Con la stella</b></td>${f(s)}</tr>`,`<tr><td>Senza stella (probabilità ≥ 60%)</td>${f(s.others)}</tr>`])}
  <p class=sm>Confidenza media delle stelle: <b>${pc(s.conf)}</b></p>
  <h4>Per fascia di confidenza</h4>${tb(['Fascia','Giocate','Confidenza media','Successi rispetto alla media','Rispetto alla linea indicativa'],s.bins.map(b=>`<tr><td>${(b.lo*100).toFixed(0)}–${(b.hi*100).toFixed(0)}%</td><td>${b.n}</td><td>${pc(b.conf)}</td><td>${pc(b.hit0)}</td><td><b>${pc(b.hit1)}</b></td></tr>`))}
  <h4>Per tipo di giocata</h4>${tb(['Giocata','Giocate','Successi rispetto alla media','Rispetto alla linea indicativa'],Object.entries(s.byStat).filter(([,o])=>o.n).map(([k,o])=>`<tr><td>${(window.__giocate&&window.__giocate.LBL[k])||k}</td>${f(o)}</tr>`))}</div>`}
async function addBT(){
  const j=await fetch('data/backtest.json?'+Date.now()).then(r=>r.ok?r.json():null).catch(()=>null);if(!j||!j.stars)return;
  const a=$('#app');let n=0;const iv=setInterval(()=>{if(a.querySelector('.card')||++n>50){clearInterval(iv);if(a.querySelector('.card'))a.insertAdjacentHTML('beforeend',btCard(j.stars))}},100)}

const _s=window.show;
window.show=function(t){_s(t);
  if(t==='v'){try{$('#app').insertAdjacentHTML('afterbegin',starCard())}catch(e){console.error(e)}}
  if(t==='t')addBT()};
window.__stelle={logStars,starCard};
})();
