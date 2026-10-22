/* Extra: contesto e minuti nelle proiezioni, registro previsioni con verifica, classifica, calcolatore di valore. */
(()=>{
const EAST=new Set(['Atlanta Hawks','Boston Celtics','Brooklyn Nets','Charlotte Hornets','Chicago Bulls','Cleveland Cavaliers','Detroit Pistons','Indiana Pacers','Miami Heat','Milwaukee Bucks','New York Knicks','Orlando Magic','Philadelphia 76ers','Toronto Raptors','Washington Wizards']);
const WEST=new Set(['Dallas Mavericks','Denver Nuggets','Golden State Warriors','Houston Rockets','LA Clippers','Los Angeles Lakers','Memphis Grizzlies','Minnesota Timberwolves','New Orleans Pelicans','Oklahoma City Thunder','Phoenix Suns','Portland Trail Blazers','Sacramento Kings','San Antonio Spurs','Utah Jazz']);
const memo={},avgTot=()=>2*mean(Object.values(tg),x=>x.pts);

// 3+4: minuti in tendenza, seconda partita in due sere, rischio garbage time, ritmo atteso (over/under)
function ctx(n,t,o){const k=n+t+o;if(k in memo)return memo[k];
  const rows=byP[n]||[],g=T.games.find(x=>!x.done&&((x.home===t&&x.away===o)||(x.home===o&&x.away===t)));let c=1;
  const m5=mean(rows.slice(-5),F.MIN),m30=mean(rows.slice(-30),F.MIN);
  if(rows.length>=5&&m30>0)c*=1+Math.max(-.08,Math.min(.08,.5*(m5/m30-1)));
  if(g){
    const last=(TGL[t]||[]).slice(-1)[0];
    if(last&&(new Date(g.date)-new Date(last.d+'T12:00:00-05:00'))/864e5<1.5)c*=.97;
    const sp=Math.abs(parseFloat((String(g.line).match(/-?\d+(\.\d+)?/)||[0])[0]));
    if(sp>=10&&m30>=28)c*=Math.max(.92,1-.01*(sp-8));
    const ou=parseFloat(g.ou);if(ou>0)c*=1+Math.max(-.06,Math.min(.06,.5*(ou/avgTot()-1)))}
  return memo[k]=c}
const _p=window.proj;
window.proj=(n,s,o,t,u)=>{const r=_p(n,s,o,t,u);if(r){const c=ctx(n,t||P[n].team,o);r.p*=c;r.cx=c}return r};

// 1: registro delle previsioni (salvato nel browser) e verifica con i risultati reali
function logPreds(){const G=window.__giocate;if(!G||!G.pool)return;
  const pr=JSON.parse(localStorage.getItem('preds')||'{}');let ch=0;
  for(const p of G.pool()){if(p.min<18||new Date(p.g.date)<=Date.now())continue;
    for(const s of['PTS','REB','AST','3PM']){const k=`${p.g.id}|${p.n}|${s}`;if(k in pr)continue;
      const e=G.est(p,s);if(!e||e.base<G.MINB[s])continue;const P=G.pth(e.p,e.sd,e.base);
      if(Math.abs(P-.5)<.1)continue;pr[k]=[+P.toFixed(3),+e.base.toFixed(2),+e.p.toFixed(2)];ch++}}
  if(ch)try{localStorage.setItem('preds',JSON.stringify(pr))}catch(x){}}
const iv=setInterval(()=>{if(typeof R!=='undefined'&&R.length&&T.games.length){clearInterval(iv);logPreds()}},700);
setTimeout(()=>clearInterval(iv),30000);

function pageV(){
  const pr=JSON.parse(localStorage.getItem('preds')||'{}'),bins=[[.5,.6],[.6,.7],[.7,.8],[.8,1.01]].map(b=>({b,n:0,h:0,c:0}));let pend=0,tot=0,hit=0;
  for(const k in pr){const[gid,n,s]=k.split('|'),[P,base]=pr[k],row=(byP[n]||[]).find(r=>r[0]===gid);
    if(!row){pend++;continue}
    const conf=Math.max(P,1-P),h=(F[s](row)>base)===(P>=.5),b=bins.find(x=>conf>=x.b[0]&&conf<x.b[1]);
    b.n++;b.c+=conf;if(h)b.h++;tot++;if(h)hit++}
  const rows=bins.map(b=>`<tr><td>${(b.b[0]*100).toFixed(0)}–${Math.min(100,b.b[1]*100).toFixed(0)}%</td><td>${b.n}</td><td>${b.n?(b.c/b.n*100).toFixed(0)+'%':'–'}</td><td>${b.n?'<b>'+(b.h/b.n*100).toFixed(0)+'%</b>':'–'}</td></tr>`).join('');
  return`<div class=card><h3>Verifica delle previsioni</h3>
  <div class="sm mu">Ogni volta che apri il sito prima di una partita, le previsioni con un vantaggio netto vengono salvate in questo browser. Quando la partita è finita vengono confrontate con il risultato. Se il modello è calibrato, il tasso di successo deve avvicinarsi alla confidenza media.</div>
  <p class=sm>Previsioni verificate: <b>${tot}</b> · azzeccate: <b>${tot?(hit/tot*100).toFixed(0)+'%':'–'}</b> · in attesa del risultato: ${pend}</p>
  <div class=sc><table><tr><th>Fascia di confidenza</th><th>Previsioni</th><th>Confidenza media</th><th>Successi</th></tr>${rows}</table></div></div>
  <div class=card><h3>Calcolatore di valore</h3>
  <div class="sm mu">Confronta la probabilità del sito con la quota del bookmaker. Un valore atteso (EV) positivo indica un vantaggio solo se la probabilità è affidabile.</div>
  <div class=row>Prob. Over % <input class=l id=vp value="55"> Quota Over <input class=l id=vo value="1.90"> Quota Under <input class=l id=vu value="1.90"></div><div id=vr class=sm></div></div>`}
function wireV(){const f=()=>{const v=i=>parseFloat(($(i).value||'').replace(',','.')),p=v('#vp')/100,qo=v('#vo'),qu=v('#vu');let h='';
  if(p>0&&p<1&&qo>1)h+=`EV Over: <b class=${p*qo-1>=0?'ok':'ko'}>${((p*qo-1)*100).toFixed(1)}%</b> · quota equa ${(1/p).toFixed(2)}<br>`;
  if(p>0&&p<1&&qu>1)h+=`EV Under: <b class=${(1-p)*qu-1>=0?'ok':'ko'}>${(((1-p)*qu-1)*100).toFixed(1)}%</b> · quota equa ${(1/(1-p)).toFixed(2)}<br>`;
  if(qo>1&&qu>1){const a=1/qo,b=1/qu;h+=`Margine del bookmaker: ${((a+b-1)*100).toFixed(1)}% · probabilità Over senza margine: ${(a/(a+b)*100).toFixed(1)}%`}
  $('#vr').innerHTML=h||'<span class=mu>Inserisci probabilità e almeno una quota.</span>'};
  ['#vp','#vo','#vu'].forEach(i=>$(i).oninput=f);f()}

// classifica e risultati dell'ultima giornata, calcolati dalle partite scaricate
function pageC(){
  const by={};for(const k in tg)(by[tg[k].gid]??=[]).push(tg[k]);
  const G=Object.values(by).filter(a=>a.length===2).map(a=>({d:tgp[a[0].gid+'|'+a[0].team].d,a})).sort((x,y)=>x.d<y.d?-1:1),rec={};
  for(const{a}of G)for(const[u,v]of[[a[0],a[1]],[a[1],a[0]]]){const r=rec[u.team]??={w:0,l:0,pf:0,pa:0,h:[]},w=u.pts>v.pts;w?r.w++:r.l++;r.pf+=u.pts;r.pa+=v.pts;r.h.push(w)}
  const ld=G.length?G[G.length-1].d:'',last=G.filter(x=>x.d===ld);
  const conf=(nm,set)=>{const l=[...set].map(t=>({t,...(rec[t]||{w:0,l:0,pf:0,pa:0,h:[]})}));
    const g=x=>x.w+x.l,pc=x=>g(x)?x.w/g(x):0,df=x=>g(x)?(x.pf-x.pa)/g(x):0;
    l.sort((a,b)=>pc(b)-pc(a)||df(b)-df(a));
    return`<div class=card><h3>${nm}</h3><div class=sc><table><tr><th>#</th><th>Squadra</th><th>V</th><th>S</th><th>%</th><th>Diff/G</th><th>Ultime 5</th></tr>${l.map((x,i)=>`<tr><td>${i+1}</td><td>${x.t}</td><td>${x.w}</td><td>${x.l}</td><td>${g(x)?pc(x).toFixed(3):'–'}</td><td class=${df(x)>=0?'ok':'ko'}>${g(x)?(df(x)>=0?'+':'')+df(x).toFixed(1):'–'}</td><td>${x.h.slice(-5).map(w=>w?'V':'S').join(' ')}</td></tr>`).join('')}</table></div></div>`};
  return`<div class=card><h3>Risultati dell'ultima giornata${ld?' ('+ld+')':''}</h3><table>${last.map(({a})=>{const[x,y]=a[0].pts>=a[1].pts?[a[0],a[1]]:[a[1],a[0]];return`<tr><td><b>${x.team}</b></td><td>${x.pts}</td><td>${y.pts}</td><td style="text-align:left">${y.team}</td></tr>`}).join('')||'<tr><td>Nessuna partita giocata.</td></tr>'}</table></div>
  ${conf('Eastern Conference',EAST)}${conf('Western Conference',WEST)}`}

const _s=window.show;
window.show=function(t){
  if(t!=='c'&&t!=='v'){_s(t);return}
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  if(!R.length){$('#app').innerHTML='<p>Nessun dato disponibile.</p>';return}
  $('#app').innerHTML=t==='c'?pageC():pageV();if(t==='v')wireV()};
document.querySelector('nav').insertAdjacentHTML('beforeend','<button data-t="c">Classifica</button><button data-t="v">Verifica</button>');
window.__extra={pageC,pageV,wireV,ctx,logPreds};
})();
