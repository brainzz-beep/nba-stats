/* Sezione "Giocate": migliori giocate della serata divise per partita, con i motivi (punti deboli delle difese, storico, triple, assenze). */
(()=>{
const LBL={PTS:'punti',REB:'rimbalzi',AST:'assist','3PM':'triple',STL:'rubate',BLK:'stoppate'},DEF={PTS:20.5,REB:8.5,AST:6.5,'3PM':2.5,STL:1.5,BLK:1.5},MINB={PTS:8,REB:3,AST:2,'3PM':1},ROLE={C:'centri',F:'ali',G:'guardie'};
const cdf=z=>{const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p};
const pth=(mu,sd,th)=>1-cdf((th-mu)/sd);
const pov=(mu,sd,L)=>pth(mu,sd,Number.isInteger(L)?L+.5:L);
const pc=x=>(x*100).toFixed(0)+'%';
let PL=[];

// partite della serata: la prima partita non ancora iniziata e tutte quelle che iniziano entro 10 ore da lei
function slate(){const now=Date.now(),up=T.games.filter(g=>!g.done&&new Date(g.date)>now-5*36e5).sort((a,b)=>new Date(a.date)-new Date(b.date));
  return up.length?up.filter(g=>new Date(g.date)-new Date(up[0].date)<10*36e5):[]}

function pool(gs){
  const now=Date.now(),o=[];
  for(const g of gs||T.games.filter(g=>!g.done&&new Date(g.date)-now<26*36e5))
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

// punti deboli di una difesa: quanto concede, per ruolo e statistica, rispetto alla media della lega
const wkM={};
function wk(o){if(wkM[o])return wkM[o];const out=[];
  for(const g of['C','F','G'])for(const s of['PTS','REB','AST','3PM']){let sum=0,c=0;
    for(const r of byO[o]||[]){if(r[7]<12||grp(r[6]||P[r[5]].pos)!==g)continue;const m=pm(r[5],s);if(m>=.8){sum+=F[s](r)/m;c++}}
    if(c>=15)out.push({g,s,f:(sum/c)/lg(s,g),c})}
  return wkM[o]=out}

// triple concesse a partita da ogni squadra (ultime 20 partite) con posizione in classifica
let TPm=null,TPn=0;
function tp3(t){if(!TPm){TPm={};for(const k in TS){const o=TS[k].slice(-20).map(x=>tg[x.gid+'|'+x.opp]).filter(Boolean);if(o.length)TPm[k]={m:mean(o,x=>x.tpm),a:mean(o,x=>x.tpa)}}
  const l=Object.keys(TPm).sort((a,b)=>TPm[b].m-TPm[a].m);l.forEach((k,i)=>TPm[k].rk=i+1);TPn=l.length}
  return TPm[t]}

function why(p,s,e){const r=[],g=grp(P[p.n].pos),w=wk(p.o).find(z=>z.g===g&&z.s===s);
  if(w&&Math.abs(w.f-1)>=.1)r.push(`${p.o} concede il ${Math.abs((w.f-1)*100).toFixed(0)}% ${w.f>1?'in più':'in meno'} di ${LBL[s]} a ${ROLE[g]} (${w.c} partite)`);
  if(e.nv>=2&&Math.abs(e.vs-e.base)>=(s==='PTS'?3:1)&&(e.vs>=1.3*e.base||e.vs<=.7*e.base))r.push(`contro ${p.o} media ${fx(e.vs)} in ${e.nv} partite (la sua media è ${fx(e.base)})`);
  if(Math.abs(e.ab)>=.8)r.push(`assenze nella sua squadra: ${e.ab>0?'+':''}${e.ab.toFixed(1)}`);
  if(s==='3PM'){const a=tp3(p.o);if(a)r.push(`${p.o} concede ${fx(a.m)} triple a partita (${a.rk}° su ${TPn})`)}
  return r}

const gm=p=>`${p.g.away} @ ${p.g.home}`;
const tbl=(h,rows)=>`<div class=sc><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.join('')}</table></div>`;

function pageB(){
  const S=R.length?slate():[];PL=S.length?pool(S):[];
  if(!PL.length)return'<p>Nessuna partita in programma.</p>';
  const when=new Date(S[0].date).toLocaleString('it-IT',{weekday:'long',hour:'2-digit',minute:'2-digit'});
  const cards=S.map(g=>{
    const ps=PL.filter(p=>p.g===g),L=[];
    for(const p of ps){if(p.min<18)continue;for(const s of['PTS','REB','AST','3PM']){const e=est(p,s);if(!e||e.base<MINB[s])continue;
      const q=pth(e.p,e.sd,e.base);L.push({p,s,e,q,ed:Math.abs(q-.5),L0:Math.round(e.base-.5)+.5})}}
    const best=[...L].sort((a,b)=>b.ed-a.ed).slice(0,4);
    const al=[];
    for(const[t,o]of[[g.away,g.home],[g.home,g.away]]){
      for(const z of wk(o).filter(z=>z.f>=1.1).sort((a,b)=>b.f-a.f).slice(0,2)){
        const nm=ps.filter(p=>p.t===t&&grp(P[p.n].pos)===z.g).slice(0,3).map(p=>p.n).join(', ');
        al.push(`<b>${o}</b> concede il ${((z.f-1)*100).toFixed(0)}% in più di ${LBL[z.s]} a ${ROLE[z.g]}: conviene guardare i ${ROLE[z.g]} di ${t}${nm?' ('+nm+')':''}`)}
      const a=tp3(o);if(a&&a.rk<=5)al.push(`<b>${o}</b> concede molte triple (${fx(a.m)} a partita, ${a.rk}° su ${TPn}): occhio ai tiratori di ${t}`);
      else if(a&&a.rk>TPn-5)al.push(`<b>${o}</b> concede poche triple (${fx(a.m)} a partita): più prudenza sulle triple di ${t}`)}
    const sp=L.filter(x=>x.e.nv>=2&&(x.e.vs>=1.4*x.e.base||x.e.vs<=.6*x.e.base)&&Math.abs(x.e.vs-x.e.base)>=(x.s==='PTS'?4:1.5))
      .sort((a,b)=>Math.abs(b.e.vs/b.e.base-1)-Math.abs(a.e.vs/a.e.base-1)).slice(0,3);
    const row=x=>`<tr><td>${x.p.n} <b class=${x.q>=.5?'ok':'ko'}>${x.q>=.5?'OVER':'UNDER'}</b> ${LBL[x.s]}</td><td>${fx(x.e.p)}</td><td>${x.L0}</td><td><b>${pc(Math.max(x.q,1-x.q))}</b></td><td style="white-space:normal;text-align:left"><small>${why(x.p,x.s,x.e).join('<br>')||'nessun motivo specifico'}</small></td></tr>`;
    return`<div class=card><h3>${gm({g})} <small>${new Date(g.date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</small></h3>
    ${al.length?`<h4>Punti deboli da sfruttare</h4><ul>${al.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    <h4>Migliori giocate</h4>${best.length?tbl(['Giocata','Proiezione','Linea indic.','Prob. vs media','Perché'],best.map(row)):'<p class="sm mu">Nessuna giocata con dati sufficienti.</p>'}
    ${sp.length?`<h4>Storico contro questa avversaria</h4><ul>${sp.map(x=>`<li>${x.p.n}: media ${fx(x.e.vs)} ${LBL[x.s]} contro ${x.p.o} in ${x.e.nv} partite, contro ${fx(x.e.base)} di media recente</li>`).join('')}</ul>`:''}</div>`}).join('');
  return`<p class="sm mu">Partite della serata (da ${when}). Le giocate sono ordinate per quanto matchup, storico e assenze spostano la proiezione rispetto alla media recente. La linea indicativa è la media arrotondata a .5: con la linea reale usa il calcolatore in fondo.</p>${cards}
  <div class=card><h3>Chi supera una linea?</h3>
  <div class=row>Statistica <select id=bs>${Object.keys(LBL).map(s=>`<option value="${s}">${LBL[s]}</option>`).join('')}</select>
  Linea <input class=l id=bl value="${DEF.PTS}" inputmode=decimal></div><div id=bo></div></div>`}

function drawC(){
  const s=$('#bs').value,L=parseFloat($('#bl').value.replace(',','.'));
  if(!(L>=0)){$('#bo').innerHTML='';return}
  const r=PL.map(p=>{const e=est(p,s);return e&&{p,e,q:pov(e.p,e.sd,L)}}).filter(Boolean).sort((a,b)=>b.q-a.q).slice(0,25);
  $('#bo').innerHTML=tbl(['Giocatore','Partita','Proiezione','Over '+L,'Under','Media recente'],
    r.map(x=>`<tr><td>${x.p.n}</td><td>${gm(x.p)}</td><td>${fx(x.e.p)}</td><td class=ok>${pc(x.q)}</td><td class=ko>${pc(1-x.q)}</td><td>${fx(x.e.base)}</td></tr>`))}

function wireB(){
  $('#bs').onchange=()=>{$('#bl').value=DEF[$('#bs').value];drawC()};
  $('#bl').oninput=drawC;drawC()}

const _show=show;
window.show=function(t){
  if(t!=='b'){_show(t);return}
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==='b'));
  $('#app').innerHTML=pageB();if(PL.length)wireB()};
document.querySelector('nav').insertAdjacentHTML('beforeend','<button data-t="b">Giocate</button>');
window.__giocate={pageB,wireB,drawC,pool,est,pth,MINB};
})();
