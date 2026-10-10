// Servidor do Escudo Amigo — Cloudflare Worker, plano GRATUITO.
// Tudo funciona sem custo dentro dos limites grátis da Cloudflare:
//   POST /cerebro  -> IA de conversa e análise de golpe (Workers AI, Llama, grátis)
//   POST /ouvir    -> transcreve áudio (Whisper, grátis): áudio de golpe do WhatsApp, consulta gravada
//   POST /ver      -> lê foto (conta, fatura, caixa de remédio, print) com IA de visão (grátis)
//   POST /email    -> manda lembrete/resumo por e-mail para a família (Resend, 3.000/mês grátis)
//   POST /fala     -> voz natural (ElevenLabs, opcional; sem chave o app usa a voz do celular + falas gravadas)
// Configurar no painel da Cloudflare: Settings > Bindings > Workers AI (nome: AI)
// Segredos opcionais: RESEND_API_KEY, e PELO MENOS UMA voz neural:
//   ELEVENLABS_API_KEY + VOZ_BR_F  (mais humana; modelo flash = resposta mais rápida)
//   AZURE_TTS_KEY + AZURE_TTS_REGION (Azure Speech, plano gratuito F0; vozes pt-BR Thalita/Francisca)
//   GOOGLE_TTS_KEY (Google Cloud Text-to-Speech, cota gratuita mensal; voz pt-BR Neural2/Chirp HD)
// A ordem é: ElevenLabs -> Azure -> Google. Se uma falhar ou acabar a cota, passa para a próxima.
const CORS={'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type'};
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...CORS,'content-type':'application/json'}});
const LLM='@cf/meta/llama-3.3-70b-instruct-fp8-fast', VISAO='@cf/meta/llama-3.2-11b-vision-instruct', OUVIDO='@cf/openai/whisper-large-v3-turbo';
export default {
  async fetch(req, env){
    if(req.method==='OPTIONS') return new Response(null,{headers:CORS});
    const url=new URL(req.url);
    try{
      if(url.pathname==='/cerebro'){ const {prompt}=await req.json();
        const r=await env.AI.run(LLM,{messages:[{role:'user',content:String(prompt||'').slice(0,24000)}],max_tokens:600,temperature:.4});
        return J({texto:r.response||''}); }
      if(url.pathname==='/ver'){ const {prompt,imagem}=await req.json();   // imagem: {base64}
        const bytes=[...Uint8Array.from(atob(imagem.base64),c=>c.charCodeAt(0))];
        const r=await env.AI.run(VISAO,{prompt:String(prompt||'').slice(0,8000),image:bytes,max_tokens:600});
        return J({texto:r.response||r.description||''}); }
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
      return new Response('Escudo Amigo',{headers:CORS});
    }catch(e){ return J({erro:String(e).slice(0,200)},500); }
  }
};

// ---- vozes neurais em cadeia (a primeira que responder) ----
async function falaNeural(t,o,env){
  const devagar=o.ritmo==='devagar', pt=o.pais==='pt', masc=o.voz==='masculina';
  if(env.ELEVENLABS_API_KEY&&env.VOZ_BR_F&&!pt&&!masc){ try{
    const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+env.VOZ_BR_F+'?output_format=mp3_22050_32&optimize_streaming_latency=3',{method:'POST',headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'content-type':'application/json'},
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
