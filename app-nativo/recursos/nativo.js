/* Ponte nativa do Escudo Amigo (Capacitor). O app web chama window.ESCUDO_NATIVO / window.ESCUDO_OUVIDO quando existem.
   Tudo aqui é opcional: se um plugin faltar, o app web continua com o comportamento do navegador. */
(function(){
  function P(n){ try{ if(!window.Capacitor) return null; var h=Capacitor.isPluginAvailable&&Capacitor.isPluginAvailable(n); if(h===false) return null; return (Capacitor.registerPlugin&&Capacitor.registerPlugin(n))||(Capacitor.Plugins&&Capacitor.Plugins[n])||null; }catch(e){ try{ return Capacitor.Plugins[n]; }catch(x){ return null; } } }
  var plat=(window.Capacitor&&Capacitor.getPlatform&&Capacitor.getPlatform())||'web'; if(plat==='web') return;
  var NOTIF=P('LocalNotifications'), HAP=P('Haptics'), CONT=P('Contacts'), SR=P('SpeechRecognition'), CAM=P('Camera'), IAP=P('NativePurchases');
  window.ESCUDO_PLATAFORMA=plat;
  try{ var APPI=P('App'); if(APPI&&APPI.getInfo) APPI.getInfo().then(function(i){ window.ESCUDO_VERSAO_LOJA=i.version+' ('+i.build+')'; }).catch(function(){}); }catch(e){}
  window.ESCUDO_NATIVO={
    // permissões pedidas no cadastro: notif, mic, contatos, ligacoes (ligações não existe no iPhone)
    pedir:async function(id){ try{
      if(id==='notif'&&NOTIF){ var r=await NOTIF.requestPermissions(); return r.display==='granted'; }
      if(id==='mic'&&SR){ var m=await SR.requestPermissions(); return m.speechRecognition==='granted'; }
      if(id==='contatos'&&CONT){ var c=await CONT.requestPermissions(); return c.contacts==='granted'; }
      if(id==='camera'&&CAM){ var k=await CAM.requestPermissions({permissions:['camera','photos']}); return k.camera==='granted'; }
      return false; }catch(e){ return false; } },
    temLigacoes:function(){ return false; },   // iOS não permite ler chamadas
    vibrar:function(tipo,pat){ if(!HAP) return; try{ if(tipo==='remedio'||tipo==='golpe') HAP.notification({type:tipo==='golpe'?'ERROR':'WARNING'}); else HAP.impact({style:'MEDIUM'}); }catch(e){} },
    contatos:async function(){ if(!CONT) return null; try{ var r=await CONT.pickContact({projection:{name:true,phones:true}}); var c=r&&r.contact; if(!c) return []; return [{nome:(c.name&&(c.name.display||c.name.given))||'',telefone:(c.phones&&c.phones[0]&&c.phones[0].number)||''}]; }catch(e){ return []; } },
    // alarmes dos remédios: notificação local todo dia no horário, com som de alarme (funciona com o app fechado)
    agendarRemedios:async function(doses){ if(!NOTIF) return false; try{
      var pend=await NOTIF.getPending(); if(pend&&pend.notifications&&pend.notifications.length) await NOTIF.cancel({notifications:pend.notifications.filter(function(n){ return n.id<900000; }).map(function(n){ return {id:n.id}; })});
      var lista=(doses||[]).map(function(d,i){ var hm=String(d.t).split(':'); return {id:1000+i,title:'Hora do remédio · '+d.t,body:d.n+(d.d?' · '+d.d:'')+'. Toque para marcar que tomou.',schedule:{on:{hour:+hm[0],minute:+hm[1]},repeats:true,allowWhileIdle:true},extra:{tipo:'remedio',id:d.id}}; });
      if(lista.length) await NOTIF.schedule({notifications:lista}); return true; }catch(e){ return false; } },
    lembrete:async function(id,quando,titulo,texto){ if(!NOTIF) return false; try{ await NOTIF.schedule({notifications:[{id:id,title:titulo,body:texto,schedule:{at:new Date(quando)}}]}); return true; }catch(e){ return false; } }
  };

  /* Assinatura Escudo Amigo Mais (compra dentro do app, App Store). Preço e período vêm da loja, nunca escritos à mão. */
  var PRODUTO='com.miopla.escudoamigo.mais.mensal';
  if(IAP) window.ESCUDO_LOJA={
    produto:PRODUTO,
    info:async function(){ try{ var r=await IAP.getProducts({productIdentifiers:[PRODUTO],productType:'subs'}); var p=r&&r.products&&r.products[0]; return p?{id:p.identifier,titulo:p.title,preco:p.priceString,moeda:p.currencyCode,descricao:p.description,teste:!!(p.introductoryPrice&&p.introductoryPrice.price===0)&&p.introEligibility!==1}:null; }catch(e){ return null; } },
    ativo:async function(){ try{ var r=await IAP.getPurchases({productType:'subs'}); var t=(r&&r.purchases||[]).filter(function(x){ return x.productIdentifier===PRODUTO&&(x.isActive===true||(x.expirationDate&&new Date(x.expirationDate)>new Date())); })[0]; return t?{ativo:true,ate:t.expirationDate||null,teste:!!t.isTrialPeriod,cancela:!!t.willCancel}:{ativo:false}; }catch(e){ return {ativo:false,erro:1}; } },
    comprar:async function(){ try{ var t=await IAP.purchaseProduct({productIdentifier:PRODUTO,productType:'subs',quantity:1}); return {ok:!!t,ate:t&&t.expirationDate}; }catch(e){ var m=String(e&&(e.message||e.code)||''); return {ok:false,cancelou:/cancel/i.test(m),erro:m}; } },
    restaurar:async function(){ try{ await IAP.restorePurchases(); }catch(e){} return window.ESCUDO_LOJA.ativo(); },
    gerenciar:async function(){ try{ await IAP.manageSubscriptions(); return true; }catch(e){ return false; } }
  };
  if(SR) window.ESCUDO_OUVIDO={
    start:async function(o){ try{ await SR.removeAllListeners(); SR.addListener('partialResults',function(d){ var t=(d.matches&&d.matches[0])||''; if(t&&o.parcial) o.parcial(t); });
      var r=await SR.start({language:o.lang||'pt-BR',maxResults:1,partialResults:true,popup:false}); if(r&&r.matches&&r.matches[0]&&o.final) o.final(r.matches[0]); }catch(e){ if(o.erro) o.erro(e); } },
    stop:function(){ try{ SR.stop(); }catch(e){} } };
  if(NOTIF&&NOTIF.addListener) NOTIF.addListener('localNotificationActionPerformed',function(a){ try{ var ex=a.notification.extra||{}; if(ex.tipo==='remedio'&&window.ESCUDO_ABRIR) window.ESCUDO_ABRIR('alarme'); }catch(e){} });
})();
