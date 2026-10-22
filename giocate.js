/* Sezione "Giocate": migliori giocate della notte, migliori matchup e probabilità di superare una linea. */
(()=>{
const LBL={PTS:'punti',REB:'rimbalzi',AST:'assist','3PM':'triple',STL:'rubate',BLK:'stoppate'},DEF={PTS:20.5,REB:8.5,AST:6.5,'3PM':2.5,STL:1.5,BLK:1.5},MINB={PTS:8,REB:3,AST:2,'3PM':1};
const cdf=z=>{const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p};
const pov=(mu,sd,L)=>1-cdf(((Number.isInteger(L)?L+.5:L)-mu)/sd);
const pc=x=>(x*100).toFixed(0)+'%';
let PL=[];

function pool(){
  const now=Date.now(),o=[];
  for(const g of T.games.filter(g=>!g.done&&new Date(g.date)-now<26*36e5))
    for(const[t,opp]of[[g.away,g.home],[g.home,g.away]]){
      const outs=new Set((T.injuries[t]||[]).filter(i=>/out/i.test(i.s)).map(i=>i.n)),on=[...outs].filter(n=>byP[n]);
      rost(t).filter(n=>!outs.has(n)).map(n=>[n,mean(byP[n].slice(-10),F.MIN)]).sort((a,b)=>b[1]-a[1]).slice(0,10)
        .forEach(([n,m])=>o.push({n,t,o:opp,g,min:m,on}))}
  return o}

function est(p,s){
  const r=proj(p.n,s,p.o,p.t,p.on);if(!r)return null;
  const rows=byP[p.n],f=F[s],base=.5*mean(rows.slice(-10),f)+.5*mean(rows.slice(-30),f);
  const x=rows.slice(-30).map(f),m=x.reduce((a,b)=>a+b,0)/x.length,k=x.length>1?x.length:0;
  const sd0=k?Math.sqrt(x.reduce((a,b)=>a+(b-m)**2,0)/(k-1)):0,pr=Math.max(Math.sqrt(Math.max(r.p,.1))*1.1,.3*r.p);
  return{...r,base,sd:Math.max(.3,(k*sd0+4*pr)/(k+4))}}

const gm=p=>`${p.g.away} @ ${p.g.home}`;
const tbl=(h,rows)=>`<div class=sc><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.join('')}</table></div>`;

function pageB(){
  PL=R.length?pool():[];
  if(!PL.length)return'<p>Nessuna partita in programma nelle prossime 26 ore.</p>';
  const L=[];
  for(const p of PL){if(p.min<18)continue;for(const s of['PTS','REB','AST','3PM']){const e=est(p,s);if(!e||e.base<MINB[s])continue;
    const L0=Math.floor(e.base)+.5,P=pov(e.p,e.sd,L0);L.push({p,s,e,L0,P,ed:Math.abs(P-.5),up:e.p/e.base-1})}}
  const best=[...L].sort((a,b)=>b.ed-a.ed).slice(0,12);
  const row1=x=>`<tr><td>${x.p.n} <b class=${x.P>=.5?'ok':'ko'}>${x.P>=.5?'OVER':'UNDER'} ${x.L0}</b> ${LBL[x.s]}</td><td>${gm(x.p)}</td><td>${fx(x.e.p)}</td><td><b>${pc(Math.max(x.P,1-x.P))}</b></td><td><small>media ${fx(x.e.base)} · matchup ${((x.e.fac-1)*100).toFixed(0)}% (n${x.e.n}) · assenze ${x.e.ab>=0?'+':''}${x.e.ab.toFixed(1)}</small></td></tr>`;
  const mu=[...L].sort((a,b)=>b.up-a.up),top=mu.slice(0,8),bot=mu.slice(-5).reverse();
  const row2=x=>`<tr><td>${x.p.n}</td><td>${LBL[x.s]}</td><td>${gm(x.p)}</td><td>${fx(x.e.p)} <small>(media ${fx(x.e.base)})</small></td><td class=${x.up>=0?'ok':'ko'}>${x.up>=0?'+':''}${(x.up*100).toFixed(0)}%</td></tr>`;
  return`<div class=card><h3>Migliori giocate della notte</h3>
  <div class="sm mu">La linea usata è la media recente del giocatore arrotondata a .5: è una stima della linea del bookmaker, non quella vera. Qui conta quanto matchup e assenze spostano la proiezione rispetto a quella linea. Con la linea reale usa il calcolatore qui sotto.</div>
  ${tbl(['Giocata','Partita','Proiezione','Probabilità','Dettagli'],best.map(row1))}</div>
  <div class=card><h3>Migliori matchup</h3>
  <h4>Più favorevoli</h4>${tbl(['Giocatore','Stat.','Partita','Proiezione','Variazione'],top.map(row2))}
  <h4>Più sfavorevoli</h4>${tbl(['Giocatore','Stat.','Partita','Proiezione','Variazione'],bot.map(row2))}</div>
  <div class=card><h3>Chi supera una linea?</h3>
  <div class=row>Statistica <select id=bs>${Object.keys(LBL).map(s=>`<option value="${s}">${LBL[s]}</option>`).join('')}</select>
  Linea <input class=l id=bl value="${DEF.PTS}" inputmode=decimal></div><div id=bo></div></div>`}

function drawC(){
  const s=$('#bs').value,L=parseFloat($('#bl').value.replace(',','.'));
  if(!(L>=0)){$('#bo').innerHTML='';return}
  const r=PL.map(p=>{const e=est(p,s);return e&&{p,e,P:pov(e.p,e.sd,L)}}).filter(Boolean).sort((a,b)=>b.P-a.P).slice(0,25);
  $('#bo').innerHTML=tbl(['Giocatore','Partita','Proiezione','Over '+L,'Under','Media recente'],
    r.map(x=>`<tr><td>${x.p.n}</td><td>${gm(x.p)}</td><td>${fx(x.e.p)}</td><td class=ok>${pc(x.P)}</td><td class=ko>${pc(1-x.P)}</td><td>${fx(x.e.base)}</td></tr>`))}

function wireB(){
  $('#bs').onchange=()=>{$('#bl').value=DEF[$('#bs').value];drawC()};
  $('#bl').oninput=drawC;drawC()}

const _show=show;
window.show=function(t){
  if(t!=='b'){_show(t);return}
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==='b'));
  $('#app').innerHTML=pageB();if(PL.length)wireB()};
document.querySelector('nav').insertAdjacentHTML('beforeend','<button data-t="b">Giocate</button>');
window.__giocate={pageB,wireB,drawC};
})();
