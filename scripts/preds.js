// Registro automatico delle previsioni: esegue il modello del sito senza browser e salva data/preds.json.
// Le previsioni già salvate non vengono mai sovrascritte (si tiene la prima, fatta prima dell'inizio della partita).
const fs=require('fs'),vm=require('vm');
const rd=f=>fs.readFileSync(f,'utf8');
const store={preds:fs.existsSync('data/preds.json')?rd('data/preds.json'):'{}'};
const el=()=>({innerHTML:'',value:'',textContent:'',style:{},classList:{toggle(){}},insertAdjacentHTML(){}});
const els={};
const ctx=vm.createContext({console,setTimeout,setInterval,clearInterval,Date,
  document:{querySelector:s=>els[s]??(els[s]=el()),querySelectorAll:()=>[],addEventListener(){}},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
  fetch:async u=>{const f=String(u).includes('today')?'data/today.json':'data/games.json';return{ok:fs.existsSync(f),json:async()=>JSON.parse(rd(f))}}});
ctx.window=ctx;
vm.runInContext(rd('index.html').match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
vm.runInContext(rd('giocate.js'),ctx);
vm.runInContext(rd('extra.js'),ctx);
(async()=>{
  for(let i=0;i<40;i++){
    await new Promise(r=>setTimeout(r,500));
    if(vm.runInContext('typeof R!=="undefined"&&R.length>0&&T.games.length>0',ctx))break;
  }
  vm.runInContext('window.__extra.logPreds()',ctx);
  fs.mkdirSync('data',{recursive:true});
  fs.writeFileSync('data/preds.json',store.preds);
  console.log('previsioni totali:',Object.keys(JSON.parse(store.preds)).length);
  process.exit(0);
})();
