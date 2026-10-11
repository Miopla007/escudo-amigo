// Servidor do Escudo Amigo — Cloudflare Worker, plano GRATUITO.
// Tudo funciona sem custo dentro dos limites grátis da Cloudflare:
//   POST /cerebro  -> IA de conversa e análise de golpe (Workers AI, Llama, grátis)
//   POST /ouvir    -> transcreve áudio (Whisper, grátis): áudio de golpe do WhatsApp, consulta gravada
//   POST /ver      -> lê foto (conta, fatura, caixa de remédio, print) com IA de visão (grátis)
//   POST /email    -> manda lembrete/resumo por e-mail para a família (Resend, 3.000/mês grátis)
//   POST /fala     -> voz natural (ElevenLabs, opcional; sem chave o app usa a voz do celular + falas gravadas)
// Configurar no painel da Cloudflare: Settings > Bindings > Workers AI (nome: AI)
// Segredos opcionais: RESEND_API_KEY, e PELO MENOS UMA voz neural:
//   ELEVENLABS_API_KEY + VOZ_BR_F (voz do Brasil) + VOZ_PT_F (voz de Portugal)  (mais humana; modelo flash = resposta mais rápida)
//   AZURE_TTS_KEY + AZURE_TTS_REGION (Azure Speech, plano gratuito F0; vozes pt-BR Thalita/Francisca)
//   GOOGLE_TTS_KEY (Google Cloud Text-to-Speech, cota gratuita mensal; voz pt-BR Neural2/Chirp HD)
// A ordem é: ElevenLabs -> Azure -> Google. Se uma falhar ou acabar a cota, passa para a próxima.
// BRAVE_API_KEY (busca na web; tem crédito mensal grátis e permite uso comercial). Sem ela, a busca usa só a Wikipedia.
// APP_TOKEN (opcional): a mesma senha cadastrada no GitHub; protege o servidor de uso por terceiros.
//   POST /busca {pergunta}  -> resposta curta + fontes      POST /tempo {lat,lon} -> previsão do tempo (MET Norway)
const CORS={'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type,x-escudo-id,x-escudo-app'};
// limite por aparelho e por dia (protege a cota grátis e o custo). Ajuste à vontade.
const COTA={'/cerebro':150,'/ver':25,'/ouvir':20,'/busca':40,'/fala':400,'/email':10,'/tempo':30};
async function cota(req,path){ const max=COTA[path]; if(!max) return true; const id=(req.headers.get('x-escudo-id')||req.headers.get('cf-connecting-ip')||'anon').slice(0,64);
  const dia=new Date().toISOString().slice(0,10), k=new Request('https://cota.escudo/'+dia+path+'/'+encodeURIComponent(id)); const c=caches.default; const h=await c.match(k); const n=h?(+(await h.text())||0):0;
  if(n>=max) return false; await c.put(k,new Response(String(n+1),{headers:{'cache-control':'public, max-age=90000'}})); return true; }
const txt=v=>v==null?'':(typeof v==='string'?v:JSON.stringify(v));   // a IA às vezes devolve objeto em vez de texto
const WUA={headers:{'user-agent':'EscudoAmigo/1.0 (https://miopla007.github.io/escudo-amigo/suporte.html)'}};
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...CORS,'content-type':'application/json'}});
const LLM='@cf/meta/llama-3.3-70b-instruct-fp8-fast', VISAO='@cf/meta/llama-3.2-11b-vision-instruct', OUVIDO='@cf/openai/whisper-large-v3-turbo';
export default {
  async fetch(req, env){
    if(req.method==='OPTIONS') return new Response(null,{headers:CORS});
    const url=new URL(req.url);
    // senha opcional do app (APP_TOKEN): se estiver configurada, só o app consegue usar o servidor
    if(env.APP_TOKEN&&url.pathname!=='/'&&req.headers.get('x-escudo-app')!==env.APP_TOKEN) return J({erro:'não autorizado'},401);
    if(!(await cota(req,url.pathname))) return J({erro:'limite do dia',texto:''},429);
    try{
      if(url.pathname==='/cerebro'){ const {prompt}=await req.json();
        const r=await env.AI.run(LLM,{messages:[{role:'user',content:String(prompt||'').slice(0,24000)}],max_tokens:600,temperature:.4});
        return J({texto:txt(r.response)}); }
      if(url.pathname==='/ver'){ const {prompt,imagem}=await req.json();   // imagem: {base64}
        const bytes=[...Uint8Array.from(atob(imagem.base64),c=>c.charCodeAt(0))];
        const r=await env.AI.run(VISAO,{prompt:String(prompt||'').slice(0,8000),image:bytes,max_tokens:600});
        return J({texto:txt(r.response||r.description)}); }
      if(url.pathname==='/ouvir'){ const buf=await req.arrayBuffer();
        const r=await env.AI.run(OUVIDO,{audio:btoa(String.fromCharCode(...new Uint8Array(buf))),language:'pt'});
        return J({texto:r.text||''}); }
      if(url.pathname==='/email'){ if(!env.RESEND_API_KEY) return J({erro:'sem chave'},501); const {para,assunto,texto}=await req.json();
        const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json'},
          body:JSON.stringify({from:'Escudo Amigo <onboarding@resend.dev>',to:[].concat(para).slice(0,5),subject:String(assunto).slice(0,120),text:String(texto).slice(0,5000)})});
        return J({ok:r.ok},r.ok?200:502); }
      if(url.pathname==='/fala'){ const {texto='',ritmo='normal',pais='br',voz='feminina'}=await req.json(); const t=String(texto).slice(0,600).trim(); if(!t) return new Response('',{status:400,headers:CORS});
        // cache na borda: a mesma frase não é gerada de novo (instantâneo e grátis)
        const ck=new Request('https://cache.escudo/fala/'+pais+'/'+voz+'/'+ritmo+'/'+encodeURIComponent(t)); const cache=caches.default; const hit=await cache.match(ck); if(hit) return new Response(hit.body,{headers:{...CORS,'content-type':'audio/mpeg','x-cache':'hit'}});
        const audio=await falaNeural(t,{ritmo,pais,voz},env); if(!audio) return new Response('sem voz',{status:501,headers:CORS});
        const out=new Response(audio,{headers:{'content-type':'audio/mpeg','cache-control':'public, max-age=2592000'}}); await cache.put(ck,out.clone());
        return new Response(out.body,{headers:{...CORS,'content-type':'audio/mpeg','x-cache':'miss'}}); }
      // pesquisa na internet com resumo simples e fontes (grátis: Wikipedia + DuckDuckGo; Brave se tiver chave)
      if(url.pathname==='/busca'){ const {pergunta='',pais='br'}=await req.json(); const q=String(pergunta).slice(0,200).trim(); if(!q) return J({erro:'vazio'},400);
        const ck=new Request('https://cache.escudo/busca/'+pais+'/'+encodeURIComponent(q.toLowerCase())); const hit=await caches.default.match(ck); if(hit) return new Response(hit.body,{headers:{...CORS,'content-type':'application/json'}});
        const fontes=await pesquisar(q,pais,env); let resposta='';
        if(fontes.length&&env.AI){ const ctx=fontes.map((f,i)=>'['+(i+1)+'] '+f.titulo+': '+f.trecho).join('\n').slice(0,6000);
          const r=await env.AI.run(LLM,{messages:[{role:'system',content:'Você responde a uma pessoa idosa, em português '+(pais==='pt'?'de Portugal':'do Brasil')+', com no máximo 3 frases curtas e simples, só com base nas fontes. Se as fontes não respondem, diga que não achou com certeza. Nunca invente. Não dê conselho médico ou financeiro definitivo: sugira confirmar com o médico ou o banco.'},{role:'user',content:'Pergunta: '+q+'\n\nFontes:\n'+ctx}],max_tokens:220,temperature:.2});
          resposta=txt(r.response).trim(); }
        const out=J({resposta:resposta||(fontes[0]?fontes[0].trecho:''),fontes:fontes.slice(0,3).map(f=>({titulo:f.titulo,url:f.url}))});
        await caches.default.put(ck,new Response(out.clone().body,{headers:{'content-type':'application/json','cache-control':'public, max-age=21600'}})); return out; }
      // previsão do tempo: MET Norway (gratuito, uso comercial permitido com crédito "Dados: MET Norway"). Precisa de lat/lon.
      if(url.pathname==='/tempo'){ const {lat,lon}=await req.json(); if(lat==null||lon==null) return J({erro:'sem local'},400);
        const la=(+lat).toFixed(3), lo=(+lon).toFixed(3);
        const w=await (await fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat='+la+'&lon='+lo,{headers:{'user-agent':'EscudoAmigo/1.0 (suporte: '+(env.CONTATO||'alpoimlandia@gmail.com')+')'},cf:{cacheTtl:1800}})).json();
        const ts=(w.properties&&w.properties.timeseries)||[]; const agora=ts[0]&&ts[0].data; const hoje=ts.slice(0,24).map(x=>x.data.instant.details.air_temperature);
        return J({agora:agora&&{temperatura:agora.instant.details.air_temperature,simbolo:agora.next_1_hours&&agora.next_1_hours.summary.symbol_code},max24h:Math.max(...hoje),min24h:Math.min(...hoje),credito:'Dados: MET Norway'}); }
      return new Response('Escudo Amigo',{headers:CORS});
    }catch(e){ return J({erro:String(e).slice(0,200)},500); }
  }
};

// ---- vozes neurais em cadeia (a primeira que responder) ----
async function falaNeural(t,o,env){
  const devagar=o.ritmo==='devagar', pt=o.pais==='pt', masc=o.voz==='masculina';
  const vozEL=pt?env.VOZ_PT_F:env.VOZ_BR_F;   // uma voz para cada país (Portugal soa diferente do Brasil)
  if(env.ELEVENLABS_API_KEY&&vozEL&&!masc){ try{
    const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+vozEL+'?output_format=mp3_22050_32&optimize_streaming_latency=3',{method:'POST',headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'content-type':'application/json'},
      body:JSON.stringify({text:t,model_id:'eleven_flash_v2_5',language_code:'pt',voice_settings:{stability:.42,similarity_boost:.8,style:.3,speed:devagar?.9:1}})});
    if(r.ok) return await r.arrayBuffer(); }catch(e){} }
  if(env.AZURE_TTS_KEY&&env.AZURE_TTS_REGION){ try{
    const nome=pt?(masc?'pt-PT-DuarteNeural':'pt-PT-RaquelNeural'):(masc?'pt-BR-AntonioNeural':'pt-BR-ThalitaMultilingualNeural');
    const ssml='<speak version="1.0" xml:lang="'+(pt?'pt-PT':'pt-BR')+'"><voice name="'+nome+'"><prosody rate="'+(devagar?'-10%':'0%')+'">'+t.replace(/[<>&]/g,' ')+'</prosody></voice></speak>';
    const r=await fetch('https://'+env.AZURE_TTS_REGION+'.tts.speech.microsoft.com/cognitiveservices/v1',{method:'POST',headers:{'Ocp-Apim-Subscription-Key':env.AZURE_TTS_KEY,'content-type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3','user-agent':'escudo-amigo'},body:ssml});
    if(r.ok) return await r.arrayBuffer(); }catch(e){} }
  if(env.GOOGLE_TTS_KEY){ try{
    const nome=pt?(masc?'pt-PT-Wavenet-B':'pt-PT-Wavenet-A'):(masc?'pt-BR-Neural2-B':'pt-BR-Neural2-C');
    const r=await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key='+env.GOOGLE_TTS_KEY,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({input:{text:t},voice:{languageCode:pt?'pt-PT':'pt-BR',name:nome},audioConfig:{audioEncoding:'MP3',speakingRate:devagar?.9:1,sampleRateHertz:24000}})});
    if(r.ok){ const j=await r.json(); return Uint8Array.from(atob(j.audioContent),c=>c.charCodeAt(0)).buffer; } }catch(e){} }
  return null;
}

// ---- busca: junta resultados de fontes gratuitas ----
async function pesquisar(q,pais,env){ const out=[]; const lang=pais==='pt'?'pt':'pt';
  try{ if(env.BRAVE_API_KEY){ const r=await fetch('https://api.search.brave.com/res/v1/web/search?count=5&search_lang=pt&country='+(pais==='pt'?'PT':'BR')+'&q='+encodeURIComponent(q),{headers:{'X-Subscription-Token':env.BRAVE_API_KEY,accept:'application/json'}});
      if(r.ok){ const j=await r.json(); (j.web&&j.web.results||[]).slice(0,5).forEach(x=>out.push({titulo:x.title,url:x.url,trecho:String(x.description||'').replace(/<[^>]+>/g,'')})); } } }catch(e){}
  // DuckDuckGo: uso só não comercial. Fica desligado no app pago; ligue com PERMITE_DDG=1 só em testes.
  if(env.PERMITE_DDG) try{ const r=await fetch('https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&kl='+(pais==='pt'?'pt-pt':'br-pt')+'&q='+encodeURIComponent(q)); if(r.ok){ const j=await r.json(); if(j.AbstractText) out.push({titulo:j.Heading||q,url:j.AbstractURL,trecho:j.AbstractText}); } }catch(e){}
  try{ const s=await (await fetch('https://'+lang+'.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=2&origin=*&srsearch='+encodeURIComponent(q),WUA)).json();
    for(const h of (s.query&&s.query.search||[])){ const t=await (await fetch('https://'+lang+'.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(h.title),WUA)).json(); if(t.extract) out.push({titulo:t.title+' (Wikipédia)',url:t.content_urls&&t.content_urls.mobile&&t.content_urls.mobile.page,trecho:t.extract}); } }catch(e){}
  return out; }
