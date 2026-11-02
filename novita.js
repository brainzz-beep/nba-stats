/* Novità: barra di ricerca nelle schede Partite e Giocate, e giocate più forti per ogni categoria (punti, assist, rimbalzi, ...). */
(()=>{
const G=window.__giocate,pc=x=>(x*100).toFixed(0)+'%',norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const key=x=>`${x.p.n} ${x.side} ${G.LBL[x.s]}`,gm=p=>`${p.g.away} @ ${p.g.home}`;
const tbl=(h,rows)=>`<div class=sc><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.join('')}</table></div>`;

function plays(){const L=[];
  for(const p of G.pool(G.slate())){if(p.min<18)continue;for(const s of G.STATS){const e=G.est(p,s);if(!e||e.base<G.MINB[s])continue;
    const q=G.pth(e.p,e.sd,e.base);L.push({p,s,e,q,c:Math.max(q,1-q),side:q>=.5?'OVER':'UNDER',L0:Math.round(e.base-.5)+.5})}}
  return L}

// le stesse "migliori della serata" mostrate in cima: probabilità almeno 60%, 10 partite di dati, un motivo concreto, una per giocatore
function nightBest(L){const seen=new Set();
  return L.map(x=>({...x,w:G.why(x.p,x.s,x.e)})).filter(x=>x.c>=.6&&byP[x.p.n].length>=10&&x.w.length)
    .sort((a,b)=>b.c-a.c).filter(x=>!seen.has(x.p.n)&&seen.add(x.p.n)).slice(0,8)}

function catHTML(L){
  const keys=new Set(nightBest(L).map(key));let h='';
  for(const s of['PTS','AST','REB','3PM','PR','PA','RA','PRA']){const seen=new Set(),l=L.filter(x=>x.s===s).sort((a,b)=>b.c-a.c).filter(x=>!seen.has(x.p.n)&&seen.add(x.p.n)).slice(0,3);
    if(!l.length)continue;
    h+=`<h4>${G.LBL[s]}</h4>`+tbl(['Giocata','Partita','Proiezione','Linea indic.','Probabilità','Perché'],l.map(x=>
      `<tr><td>${keys.has(key(x))?'<span style="color:#e8a900" title="Tra le migliori della serata">★</span> ':''}${x.p.n} <b class=${x.q>=.5?'ok':'ko'}>${x.side}</b></td><td>${gm(x.p)}</td><td>${fx(x.e.p)}</td><td>${x.L0}</td><td><b>${pc(x.c)}</b></td><td style="white-space:normal;text-align:left"><small>${G.why(x.p,x.s,x.e).slice(0,2).join('<br>')||'nessun motivo specifico'}${x.e&&G.parts(x.p,x.s)?'<br><span class=mu>'+G.parts(x.p,x.s)+'</span>':''}</small></td></tr>`))}
  return{keys,html:`<div class=card><h3>Le più forti per categoria</h3><div class="sm mu">Per ogni tipo di giocata, le tre più probabili della serata (una per giocatore). La stella ★ segna quelle che sono anche tra le migliori della serata, in cima alla pagina.</div>${h}</div>`}}

function cats(){const a=document.querySelector('#app'),first=a.querySelector('.card');if(!first)return;
  const L=plays();if(!L.length)return;const c=catHTML(L);first.insertAdjacentHTML('afterend',c.html);
  a.querySelectorAll('.card').forEach(card=>{const h=card.querySelector('h3');if(!h||!h.textContent.includes('@'))return;
    card.querySelectorAll('tr').forEach(tr=>{const td=tr.cells[0];if(td&&c.keys.has(td.textContent.trim()))td.insertAdjacentHTML('afterbegin','<span style="color:#e8a900" title="Tra le migliori della serata">★ </span>')})})}

function search(){const a=document.querySelector('#app');
  a.insertAdjacentHTML('afterbegin','<input id=qs type=search placeholder="🔎 Cerca una squadra o un giocatore…" style="width:100%;padding:10px 16px;margin-bottom:12px;border-radius:999px;border:1px solid var(--bd);background:var(--cd);color:var(--fg);font:inherit">');
  document.querySelector('#qs').oninput=e=>{const k=norm(e.target.value).split(/\s+/).filter(Boolean);
    a.querySelectorAll('.card').forEach(c=>{const h=c.querySelector('h3');if(!h||!h.textContent.includes('@'))return;
      const t=norm(c.textContent);c.style.display=k.every(w=>t.includes(w))?'':'none'})}}

const _s=window.show;
window.show=function(t){_s(t);if(t!=='g'&&t!=='b')return;
  if(t==='b'){try{cats()}catch(e){console.error(e)}}
  try{search()}catch(e){console.error(e)}};
window.__novita={plays,catHTML,nightBest};
})();
