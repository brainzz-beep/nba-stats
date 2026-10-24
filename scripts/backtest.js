// Test del modello sul passato: per ogni giornata ricalcola le previsioni usando solo i dati precedenti e le confronta con i risultati reali.
const fs=require('fs'),vm=require('vm');
const rd=f=>fs.readFileSync(f,'utf8');
const cdf=z=>{const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p};
const ALL=JSON.parse(rd('data/games.json')).filter(r=>!/^Team /.test(r[2])&&!/^Team /.test(r[3]));
const main=rd('index.html').match(/<script>([\s\S]*?)<\/script>/)[1],giocate=rd('giocate.js'),extra=rd('extra.js');
const days=[...new Set(ALL.map(r=>r[1]))].sort();
const from=process.env.BT_FROM||days[Math.floor(days.length*0.3)];
const val={PTS:r=>r[8],REB:r=>r[15],AST:r=>r[16],'3PM':r=>r[11]};
const el=()=>({innerHTML:'',value:'',textContent:'',style:{},classList:{toggle(){}},insertAdjacentHTML(){}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const preds=[];

async function day(D){
  const before=ALL.filter(r=>r[1]<D),today=ALL.filter(r=>r[1]===D);
  if(before.length<500||!today.length)return;
  const games=[...new Set(today.map(r=>r[0]))].map(id=>{const rs=today.filter(r=>r[0]===id);
    const h=rs.find(r=>r[4]===1),a=rs.find(r=>r[4]===0);return h&&a?{id,date:D+'T23:00:00-05:00',done:false,home:h[2],away:a[2],line:'',ou:''}:null}).filter(Boolean);
  const els={};
  const ctx=vm.createContext({console:{log(){},error(){}},setTimeout,setInterval,clearInterval,Date,
    document:{querySelector:s=>els[s]??(els[s]=el()),querySelectorAll:()=>[],addEventListener(){}},
    localStorage:{getItem:()=>null,setItem(){}},
    fetch:async u=>({ok:true,json:async()=>String(u).includes('today')?{games:[],injuries:{}}:before})});
  ctx.window=ctx;
  vm.runInContext(main,ctx);vm.runInContext(giocate,ctx);vm.runInContext(extra,ctx);
  for(let i=0;i<300&&!vm.runInContext('typeof R!=="undefined"&&R.length>0',ctx);i++)await wait(10);
  const out=JSON.parse(vm.runInContext(`(()=>{const G=window.__giocate,o=[];for(const p of G.pool(${JSON.stringify(games)})){if(p.min<18)continue;
    for(const s of['PTS','REB','AST','3PM']){const e=G.est(p,s);if(!e||e.base<G.MINB[s])continue;o.push([p.n,p.g.id,s,e.p,e.sd,e.base,byP[p.n].length])}}return JSON.stringify(o)})()`,ctx));
  const act={};for(const r of today)act[r[0]+'|'+r[5]]=r;
  for(const[n,gid,s,p,sd,base,ng]of out){const r=act[gid+'|'+n];if(!r)continue;const a=val[s](r),L0=Math.round(base-.5)+.5;
    preds.push({s,ng,q0:1-cdf((base-p)/Math.max(sd,.3)),o0:a>base,q1:1-cdf((L0-p)/Math.max(sd,.3)),o1:a>L0})}
}

function table(key){
  const bins=[[.5,.55],[.55,.6],[.6,.7],[.7,1.01]].map(b=>({lo:b[0],hi:Math.min(1,b[1]),n:0,h:0,c:0}));
  for(const x of preds){const q=x['q'+key],c=Math.max(q,1-q),hit=(x['o'+key])===(q>=.5),b=bins.find(b=>c>=b.lo&&c<b.hi*(b.hi>=1?1.02:1));if(!b)continue;b.n++;b.c+=c;if(hit)b.h++}
  return bins.map(b=>({lo:b.lo,hi:b.hi,n:b.n,conf:b.n?b.c/b.n:null,hit:b.n?b.h/b.n:null}));
}

(async()=>{
  const ds=days.filter(d=>d>=from&&d<days[days.length-1]);
  for(const D of ds)await day(D);
  const strong=preds.filter(x=>Math.max(x.q1,1-x.q1)>=.6),top=strong.filter(x=>x.ng>=10);
  const hit=a=>a.length?a.filter(x=>x.o1===(x.q1>=.5)).length/a.length:null;
  const brier=preds.length?preds.reduce((s,x)=>s+((x.q1)-(x.o1?1:0))**2,0)/preds.length:null;
  const res={generated:new Date().toISOString(),from,to:ds[ds.length-1]||null,days:ds.length,n:preds.length,brier,
    line:table('1'),avg:table('0'),
    byStat:Object.fromEntries(['PTS','REB','AST','3PM'].map(s=>{const a=strong.filter(x=>x.s===s);return[s,{n:a.length,hit:hit(a)}]})),
    top:{n:top.length,hit:hit(top)}};
  fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/backtest.json',JSON.stringify(res));
  console.log('giorni',res.days,'previsioni',res.n,'brier',brier&&brier.toFixed(4),'top',res.top.n,res.top.hit);
  process.exit(0);
})();
