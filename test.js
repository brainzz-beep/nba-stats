/* Scheda "Test passato": risultati del test del modello sulle partite già giocate. */
(()=>{
const pc=x=>x==null?'–':(x*100).toFixed(0)+'%';
const tab=(t,b)=>`<h4>${t}</h4><div class=sc><table><tr><th>Fascia di confidenza</th><th>Previsioni</th><th>Confidenza media</th><th>Successi</th></tr>${b.map(x=>`<tr><td>${(x.lo*100).toFixed(0)}–${(x.hi*100).toFixed(0)}%</td><td>${x.n}</td><td>${pc(x.conf)}</td><td><b>${pc(x.hit)}</b></td></tr>`).join('')}</table></div>`;
async function page(){
  const j=await fetch('data/backtest.json?'+Date.now()).then(r=>r.ok?r.json():null).catch(()=>null);
  if(!j)return'<div class=card><h3>Test sul passato</h3><p>Non ancora eseguito. Su GitHub apri Actions → "Test del modello sul passato" → Run workflow, poi ricarica questa pagina.</p></div>';
  return`<div class=card><h3>Test del modello sul passato</h3>
  <div class="sm mu">Per ogni giornata dal ${j.from} al ${j.to} il modello è stato rifatto usando solo i dati precedenti a quel giorno, e le previsioni sono state confrontate con i risultati veri. Giorni testati: <b>${j.days}</b> · previsioni: <b>${j.n}</b> · errore di Brier: <b>${j.brier==null?'–':j.brier.toFixed(3)}</b> (0,250 equivale a tirare a caso, più basso è meglio).</div>
  ${tab('Rispetto a una linea indicativa (media recente arrotondata a .5)',j.line)}${tab('Rispetto alla media recente',j.avg)}
  <h4>Giocate forti (probabilità almeno 60%)</h4><div class=sc><table><tr><th>Statistica</th><th>Previsioni</th><th>Successi</th></tr>${Object.entries(j.byStat).map(([s,x])=>`<tr><td>${s}</td><td>${x.n}</td><td><b>${pc(x.hit)}</b></td></tr>`).join('')}<tr><td><b>Con almeno 10 partite di dati</b></td><td>${j.top.n}</td><td><b>${pc(j.top.hit)}</b></td></tr></table></div>
  <p class="sm mu">Come leggerlo: se nella fascia 60-70% i successi sono vicini alla confidenza, il modello è calibrato. Attenzione: la linea usata qui è una stima, non quella vera del bookmaker, che è più precisa. Gli infortuni, le quote e le assenze del passato non sono inclusi. I risultati reali con le linee vere saranno più bassi.</p></div>`}
const _s=window.show;
window.show=function(t){if(t!=='t'){_s(t);return}
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==='t'));
  $('#app').innerHTML='<p>Caricamento…</p>';page().then(h=>{$('#app').innerHTML=h})};
document.querySelector('nav').insertAdjacentHTML('beforeend','<button data-t="t">Test passato</button>');
})();
