// Servidor do Escudo Amigo — Cloudflare Worker, plano GRATUITO.
// Tudo funciona sem custo dentro dos limites grátis da Cloudflare:
//   POST /cerebro  -> IA de conversa e análise de golpe (Workers AI, Llama, grátis)
//   POST /ouvir    -> transcreve áudio (Whisper, grátis): áudio de golpe do WhatsApp, consulta gravada
//   POST /ver      -> lê foto (conta, fatura, caixa de remédio, print) com IA de visão (grátis)
//   POST /email    -> manda lembrete/resumo por e-mail para a família (Resend, 3.000/mês grátis)
//   POST /fala     -> voz natural (ElevenLabs, opcional; sem chave o app usa a voz do celular + falas gravadas)
// Configurar no painel da Cloudflare: Settings > Bindings > Workers AI (nome: AI)
// Segredos opcionais: RESEND_API_KEY, ELEVENLABS_API_KEY, VOZ_BR_F
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
      if(url.pathname==='/fala'){ if(!env.ELEVENLABS_API_KEY||!env.VOZ_BR_F) return new Response('sem voz',{status:501,headers:CORS}); const {texto='',ritmo='normal'}=await req.json();
        const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+env.VOZ_BR_F+'/stream?output_format=mp3_44100_64',{method:'POST',headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'content-type':'application/json'},
          body:JSON.stringify({text:String(texto).slice(0,600),model_id:'eleven_multilingual_v2',voice_settings:{stability:.45,similarity_boost:.8,style:.35,speed:ritmo==='devagar'?.9:1}})});
        return new Response(r.body,{status:r.status,headers:{...CORS,'content-type':'audio/mpeg'}}); }
      return new Response('Escudo Amigo',{headers:CORS});
    }catch(e){ return J({erro:String(e).slice(0,200)},500); }
  }
};
