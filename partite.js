/* Risultati delle giornate precedenti: clicca una partita per vedere i punti per quarto e le statistiche dei giocatori. */
(()=>{
let LN={},GL=[];
fetch('data/lines.json?'+Date.now()).then(r=>r.ok?r.json():{}).then(j=>{LN=j}).catch(()=>{});
const games=()=>{const b={};for(const k in tg)(b[tg[k].gid]??=[]).push(tg[k]);
  return Object.values(b).filter(a=>a.length===2).map(a=>({gid:a[0].gid,d:tgp[a[0].gid+'|'+a[0].team].d,a}))};

function det(gid){
  const g=GL.find(x=>x.gid===gid),[x,y]=g.a,q=LN[gid]||{},la=q[x.team],lb=q[y.team];let h='';
  if(la&&lb){const n=Math.max(la.length,lb.length),hd=[...Array(n)].map((_,i)=>i<4?(i+1)+'Q':'OT'+(i>4?i-3:''));
    const row=(t,m,o)=>`<tr><td>${t}</td>${m.map((v,i)=>`<td class=${v>(o[i]??0)?'ok':v<(o[i]??0)?'ko':''}>${v}</td>`).join('')}<td><b>${m.reduce((s,v)=>s+v,0)}</b></td></tr>`;
    h+=`<div class=sc><table><tr><th>Punti per quarto</th>${hd.map(z=>`<th>${z}</th>`).join('')}<th>Tot</th></tr>${row(x.team,la,lb)}${row(y.team,lb,la)}</table></div>`}
  else h+='<p class="sm mu">Punteggio per quarti non ancora disponibile: si aggiorna al prossimo giro automatico.</p>';
  const f=(m,a)=>`${m}/${a}`;
  for(const t of[x.team,y.team]){const rs=R.filter(r=>r[0]===gid&&r[2]===t).sort((a,b)=>b[7]-a[7]);
    h+=`<h4>${t}</h4><div class=sc><table><tr><th>Giocatore</th><th>MIN</th><th>PTS</th><th>2P</th><th>3P</th><th>TL</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th></tr>${rs.map(r=>`<tr><td>${r[5]}</td><td>${Math.round(r[7])}</td><td><b>${r[8]}</b></td><td>${f(r[9]-r[11],r[10]-r[12])}</td><td>${f(r[11],r[12])}</td><td>${f(r[13],r[14])}</td><td>${r[15]}</td><td>${r[16]}</td><td>${r[17]}</td><td>${r[18]}</td></tr>`).join('')}</table></div>`}
  return h}

function drawR(){
  const l=GL.filter(x=>x.d===$('#cd').value);
  $('#cr').innerHTML=l.map(({gid,a})=>{const[x,y]=a[0].pts>=a[1].pts?[a[0],a[1]]:[a[1],a[0]];
    return`<div class=gr data-g="${gid}" style="cursor:pointer;padding:6px 0;border-bottom:1px solid var(--bd)"><b>${x.team}</b> ${x.pts} – ${y.pts} ${y.team} <small class=mu>▸ dettagli</small></div><div id="g${gid}" hidden></div>`}).join('')||'<p>Nessuna partita.</p>'}

const _s=window.show;
window.show=function(t){_s(t);if(t!=='c'||!R.length)return;
  GL=games();const ds=[...new Set(GL.map(x=>x.d))].sort().reverse(),c=$('#app').firstElementChild;if(!c||!ds.length)return;
  c.outerHTML=`<div class=card><h3>Risultati</h3><div class=row>Giornata <select id=cd>${ds.map(d=>`<option>${d}</option>`).join('')}</select><small class=mu>Clicca una partita per quarti e statistiche</small></div><div id=cr></div></div>`;
  $('#cd').onchange=drawR;drawR()};
document.addEventListener('click',e=>{const r=e.target.closest&&e.target.closest('.gr');if(!r)return;
  const d=document.getElementById('g'+r.dataset.g);if(!d)return;if(!d.innerHTML)d.innerHTML=det(r.dataset.g);d.hidden=!d.hidden});
window.__partite={det,games};
})();
