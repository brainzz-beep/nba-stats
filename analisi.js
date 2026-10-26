/* Analisi di una giocata: medie, storico contro l'avversaria e quante volte il giocatore ha superato la linea. */
(()=>{
const LBL=window.__giocate.LBL;
const pc=x=>(x*100).toFixed(0)+'%';
let PP=[];

function analyze(p,s,L){
  const G=window.__giocate,e=G.est(p,s);if(!e||!(L>=0))return'';
  const f=F[s],all=byP[p.n].map(f),vs=byP[p.n].filter(r=>r[3]===p.o).map(f),l10=all.slice(-10),th=Number.isInteger(L)?L+.5:L;
  const hit=a=>a.filter(v=>v>th).length,po=G.pth(e.p,e.sd,th),av=a=>mean(a,x=>x);
  const sg=[av(l10)>L,e.p>L,hit(all)/all.length>=.6],mx=3+(vs.length>=2?1:0);
  if(vs.length>=2)sg.push(av(vs)>L);
  return`<div class=sm><b>${p.n}</b> · ${LBL[s]} · linea ${L} · ${p.t} contro ${p.o}</div><ul>
  <li>Media ultime 10 partite: <b>${fx(av(l10))}</b> · ultime 30: ${fx(av(all.slice(-30)))} · tutte (${all.length}): ${fx(av(all))}</li>
  <li>Contro ${p.o}: ${vs.length?`media <b>${fx(av(vs))}</b> in ${vs.length} partite (${vs.slice(-10).join(', ')})`:'nessuna partita nei dati'}</li>
  <li>Ha superato ${L} in <b>${hit(all)} partite su ${all.length}</b>${vs.length?` e in <b>${hit(vs)} su ${vs.length}</b> contro ${p.o}`:''}</li>
  <li>Proiezione: <b>${fx(e.p)}</b> (matchup ${((e.fac-1)*100).toFixed(0)}%, assenze ${e.ab>=0?'+':''}${e.ab.toFixed(1)}) · probabilità Over <b>${pc(po)}</b>, Under ${pc(1-po)}</li>
  <li>Segnali a favore dell'Over: <b>${sg.filter(Boolean).length} su ${mx}</b></li></ul>`}

function card(){
  PP=window.__giocate.pool();if(!PP.length)return'';
  return`<div class=card><h3>Analizza una giocata</h3>
  <div class="sm mu">Scegli giocatore, statistica e la linea del bookmaker: vedi le medie, lo storico contro l'avversaria e quante volte ha superato quella linea.</div>
  <div class=row><select id=an>${PP.map((p,i)=>`<option value="${i}">${p.n} (${p.t} vs ${p.o})</option>`).join('')}</select>
  <select id=as>${Object.keys(LBL).map(s=>`<option value="${s}">${LBL[s]}</option>`).join('')}</select>
  Linea <input class=l id=al value="3.5" inputmode=decimal></div><div id=ao></div></div>`}

function wire(){const g=()=>{$('#ao').innerHTML=analyze(PP[+$('#an').value],$('#as').value,parseFloat($('#al').value.replace(',','.')))};
  ['#an','#as'].forEach(i=>$(i).onchange=g);$('#al').oninput=g;g()}

const _s=window.show;
window.show=function(t){_s(t);if(t!=='b')return;const c=card();if(c){$('#app').insertAdjacentHTML('beforeend',c);wire()}};
window.__analisi={analyze};
})();
