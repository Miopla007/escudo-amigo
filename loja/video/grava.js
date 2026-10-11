// Vídeo de demonstração para a revisão da Apple (frames via CDP screencast + legendas por etapa).
const H=require('/home/claude/escudo/testes/harness.js'); const fs=require('fs');
const OUT='/home/claude/escudo/testes/video/frames/'; fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); const S='/tmp/claude-0/-home-claude-escudo-amigo/82079a44-fb2f-5821-93a0-81d4033aaf54/scratchpad/fotos/';
const caps=[]; const t0=Date.now(); const cap=t=>caps.push([Date.now()-t0,t]);
async function synth(p,a,attrs){ await p.evaluate(([a,attrs])=>{ const b=document.createElement('button'); b.dataset.a=a; for(const k in attrs) b.setAttribute('data-'+k,attrs[k]); b.style.cssText='position:fixed;left:-99px'; document.body.appendChild(b); b.click(); b.remove(); },[a,attrs||{}]); }
async function tap(p,sel){ const el=await p.$(sel); if(!el) { console.log('falta',sel); return; } const bb=await el.boundingBox(); await p.evaluate(([x,y])=>{ const d=document.createElement('div'); d.style.cssText=`position:fixed;left:${x-26}px;top:${y-26}px;width:52px;height:52px;border-radius:50%;background:rgba(40,40,40,.28);border:3px solid rgba(255,255,255,.9);z-index:99999;pointer-events:none;transition:transform .35s,opacity .35s`; document.body.appendChild(d); setTimeout(()=>{d.style.transform='scale(1.5)';d.style.opacity='0'},180); setTimeout(()=>d.remove(),700); },[bb.x+bb.width/2,bb.y+bb.height/2]); await wait(250); await el.click(); }
(async()=>{ const {page:p,errs,close}=await H.abrir({w:430,h:932,dpr:3});
  await p.addInitScript(()=>{ try{ localStorage.setItem('ea-cfg',JSON.stringify({pais:'br',iaOk:false})); }catch(e){}
    window.ESCUDO_LOJA={info:async()=>({preco:'R$ 19,90',teste:true}),ativo:async()=>({ativo:false}),comprar:async()=>({ok:false}),restaurar:async()=>({ativo:false}),gerenciar:async()=>{}}; });
  await p.reload(); await wait(1500);
  const cdp=await p.context().newCDPSession(p); let n=0;
  cdp.on('Page.screencastFrame',async f=>{ const t=Date.now()-t0; fs.writeFileSync(OUT+String(n).padStart(5,'0')+'_'+t+'.jpg',Buffer.from(f.data,'base64')); n++; try{ await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}); }catch(e){} });
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1290,maxHeight:2796,everyNthFrame:1});
  cap('Escudo Amigo helps people aged 60+ with scams, medicines, money and family. Big text, voice-first.'); await wait(3500);
  await tap(p,'.intro>.btn'); await wait(2200); await tap(p,'.intro>.btn'); await wait(2200);
  cap('Setup takes seconds (name, family contacts). Here we skip to the main screen.'); await tap(p,'.skip'); await wait(1500); await tap(p,'[data-a=cadfim]'); await wait(1200);
  const FT={a:'data:image/jpeg;base64,'+fs.readFileSync(S+'medica.jpg').toString('base64'),b:'data:image/jpeg;base64,'+fs.readFileSync(S+'farma.jpg').toString('base64'),c:'data:image/jpeg;base64,'+fs.readFileSync(S+'filha.jpg').toString('base64')};
  await p.evaluate((FT)=>{ Motor.CFG.sons=false; Motor.saveCfg(); Motor.reset(true); const S=Motor.S; S.nome='Lúcia';
    S.contatos=[{n:'Marta',rel:'Filha',tel:'11988887777',cor:'#A84508'},{n:'Paulo',rel:'Filho',tel:'11977776666',cor:'#1B4DB3'}];
    S.amigos=[{n:'Dra. Ana',f:'Cardiologista',tel:'11955554444',cor:'#6236C9',foto:FT.a},{n:'Farmácia do bairro',f:'Farmácia',tel:'1133332222',cor:'#0B6B3C',foto:FT.b},{n:'Marta',f:'Filha',tel:'11988887777',cor:'#A84508',foto:FT.c}];
    S.demo=false; Motor.save(); Motor.changed(); Motor.alarmes().forEach(a=>Motor.aplicar([{tipo:'marcar_dose',id:a.id}])); },FT);
  await synth(p,'home'); await wait(1200);
  cap('Main screen: four friendly helpers. Scams, Medicines, Money and Day-to-day.'); await wait(4000);
  // golpe
  cap('1. Scam check: the person pastes or shares a suspicious message. Checked on the device, no account needed.');
  await synth(p,'exemplo',{t:'BANCO: sua conta foi bloqueada. Atualize seus dados agora: bit.ly/x1banco'}); await wait(6500);
  await p.mouse.wheel(0,500); await wait(2500); await synth(p,'home'); await wait(1500);
  // remédio
  cap('2. Medicine alarm at the exact time (local notification on iPhone). One tap on "Tomei" (taken).');
  await p.evaluate(()=>{ const d=new Date(); const h=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); Motor.S.doses.push({id:'dX',t:h,n:'Losartana',d:'50 mg · 1 comprimido',desde:Motor.hoje()}); Motor.save(); });
  await synth(p,'go',{to:'alarme'}); await wait(3500); await tap(p,'[data-a=tomei]'); await wait(3500);
  await synth(p,'go',{to:'remedios'}); await wait(3500);
  // voz
  cap('3. Voice: "I spent 40 reais at the pharmacy" — the expense is logged. Simple commands work offline.');
  await tap(p,'.dock [data-a=voz]'); await wait(1500); await H.falar(p,'Gastei 40 reais na farmácia'); await p.click('[data-a=ouvirok]',{timeout:800}).catch(()=>{}); await wait(5500);
  await p.click('.vhead [data-a=close]',{timeout:1500}).catch(()=>p.evaluate(()=>{ const x=document.querySelector('[data-a=close]'); x&&x.click(); })); await wait(1000);
  cap('Money: monthly total, goals and a simple spreadsheet.'); await synth(p,'go',{to:'financas'}); await wait(4500);
  // amigos
  cap('4. "My friends": doctor, pharmacy and family with photos. Calls always ask for confirmation.');
  await synth(p,'go',{to:'amigos'}); await wait(3000); await tap(p,'.amigo .am-foto'); await wait(3000);
  await p.evaluate(()=>{ const x=document.querySelector('#layer [data-a=close]'); x&&x.click(); }); await wait(1000);
  // SOS
  cap('5. SOS: family or emergency number in one place. Nothing is dialed without a second confirmation.');
  await tap(p,'.dock .sos'); await wait(4500); await p.evaluate(()=>{ const x=document.querySelector('#layer [data-a=close]'); x&&x.click(); }); await wait(1000);
  // assinatura
  cap('6. Optional subscription "Escudo Amigo Mais" (Settings > Escudo Amigo Mais). Free features stay free forever.');
  await synth(p,'cfg'); await wait(2500); await p.evaluate(()=>{ const b=[...document.querySelectorAll('#layer button')].find(b=>/Escudo Amigo Mais/.test(b.textContent)); b&&b.scrollIntoView({block:'center'}); }); await wait(1500);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll('#layer button')].find(b=>/Escudo Amigo Mais/.test(b.textContent)); b&&b.click(); }); await wait(4000);
  cap('Price shown before purchase: R$ 19,90/month (4,99 € in Portugal), 7-day free trial, auto-renew terms, Restore, Terms and Privacy links.');
  await p.mouse.wheel(0,700); await wait(5000);
  cap('On iPhone, "Começar meus 7 dias grátis" opens Apple\'s purchase sheet (StoreKit). The AI features then work via our server.'); await wait(4500);
  await p.evaluate(()=>{ const x=document.querySelector('#layer [data-a=close]'); x&&x.click(); }); await wait(800);
  // Portugal
  cap('Portugal: same app in European Portuguese, euros and 112 — chosen in Settings.');
  await p.evaluate(()=>{ Motor.CFG.pais='pt'; Motor.saveCfg(); Motor.changed(); }); await synth(p,'home'); await wait(1200); await synth(p,'go',{to:'amigos'}); await wait(2500); await synth(p,'home'); await wait(3500);
  cap(''); await wait(500);
  await cdp.send('Page.stopScreencast'); fs.writeFileSync(OUT+'caps.json',JSON.stringify({caps,fim:Date.now()-t0})); console.log('frames',n,'errs',errs); await close(); })();
