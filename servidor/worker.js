// Servidor do Escudo Amigo (Cloudflare Worker).
// Guarda as chaves com segurança e faz duas coisas para o app:
//   POST /fala     -> voz natural ao vivo (ElevenLabs), devolve áudio mp3
//   POST /cerebro  -> cérebro IA (Claude), devolve o JSON da resposta do protetor
// Chaves (Settings > Variables > Secrets): ELEVENLABS_API_KEY, ANTHROPIC_API_KEY
// Vozes (opcional, Variables): VOZ_BR_F, VOZ_BR_M, VOZ_PT_F, VOZ_PT_M  (ids de voz da ElevenLabs)
const CORS={'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type'};
export default {
  async fetch(req, env){
    if(req.method==='OPTIONS') return new Response(null,{headers:CORS});
    const url=new URL(req.url);
    try{
      if(url.pathname==='/fala'&&req.method==='POST'){
        const {texto='',pais='br',voz='feminina',ritmo='normal'}=await req.json();
        const id=env['VOZ_'+(pais==='pt'?'PT':'BR')+'_'+(voz==='masculina'?'M':'F')];
        if(!id||!texto) return new Response('sem voz',{status:400,headers:CORS});
        const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+id+'/stream?output_format=mp3_44100_64',{method:'POST',
          headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'content-type':'application/json'},
          body:JSON.stringify({text:String(texto).slice(0,600),model_id:'eleven_multilingual_v2',language_code:pais==='pt'?'pt':'pt',
            voice_settings:{stability:.45,similarity_boost:.8,style:.35,use_speaker_boost:true,speed:ritmo==='devagar'?.9:ritmo==='animada'?1.06:1}})});
        return new Response(r.body,{status:r.status,headers:{...CORS,'content-type':'audio/mpeg'}});
      }
      if(url.pathname==='/cerebro'&&req.method==='POST'){
        const {prompt,imagem,rapido}=await req.json();   // imagem: {tipo:'image/jpeg', base64:'...'}
        const content=[]; if(imagem) content.push({type:'image',source:{type:'base64',media_type:imagem.tipo,data:imagem.base64}});
        content.push({type:'text',text:String(prompt||'').slice(0,60000)});
        const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
          body:JSON.stringify({model:rapido?'claude-haiku-4-5-20251001':'claude-sonnet-5-5',max_tokens:700,messages:[{role:'user',content}]})});
        const j=await r.json(); const txt=(j.content||[]).map(c=>c.text||'').join('');
        return new Response(JSON.stringify({texto:txt}),{status:r.ok?200:502,headers:{...CORS,'content-type':'application/json'}});
      }
      return new Response('Escudo Amigo',{headers:CORS});
    }catch(e){ return new Response('erro',{status:500,headers:CORS}); }
  }
};
