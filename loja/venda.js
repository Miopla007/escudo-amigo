// Imagens de venda: foto de uso real (Tripo · GPT Image 2.5) + tela verdadeira do app. 1320x2868.
const fs=require('fs'); const { chromium }=require('playwright');
const RAW='/home/claude/escudo/testes/v35/raw/'; const FOT='/tmp/claude-0/-home-claude-escudo-amigo/82079a44-fb2f-5821-93a0-81d4033aaf54/scratchpad/fotos/';
const OUT=process.argv[2]||'/home/claude/escudo-amigo/loja/prints/';
const FD='/tmp/claude-0/-home-claude/82079a44-fb2f-5821-93a0-81d4033aaf54/scratchpad/fonts/node_modules/@fontsource/';
const f64=(d,w)=>fs.readFileSync(FD+d+'/files/'+d+'-latin-'+w+'-normal.woff2').toString('base64');
// [foto, tela, início do recorte, cor, deslocamento da foto]
const CENA=[[1,'1',0,'#8E1712',40],[2,'3',120,'#9A6A00',0],[3,'4',180,'#1B4DB3',0],[4,'sos',{br:960,pt:1150},'#5A1410',60],[5,'5',0,'#0B6B3C',0],[6,'6',0,'#A84508',0]];
const TX={br:[['Mensagem estranha no celular?','Me mostre antes de clicar. Eu digo se é golpe e o que fazer.'],
 ['Esqueceu o remédio? Não mais.','O alarme toca na hora certa. Um toque em “Tomei” e pronto.'],
 ['Sem digitar nada. É só falar.','“Gastei 40 reais na farmácia” — e eu anoto pra você.'],
 ['Passou mal? Peça ajuda na hora.','Família, SAMU ou polícia, sem procurar número.'],
 ['As contas do mês, sem planilha.','Fale o gasto, eu somo. E guardo para os seus sonhos.'],
 ['Para os filhos: tranquilidade.','Quem cuida está a um toque. Uma assinatura vale para a família toda.']],
 pt:[['Mensagem estranha no telemóvel?','Mostre-me antes de carregar no link. Digo se é burla e o que fazer.'],
 ['Esqueceu o remédio? Nunca mais.','O alarme toca à hora certa. Um toque em “Tomei” e pronto.'],
 ['Sem escrever nada. É só falar.','“Gastei 25 euros na farmácia” — e eu aponto por si.'],
 ['Sentiu-se mal? Peça ajuda já.','A família ou o 112 num toque, sem procurar números.'],
 ['As contas do mês, sem complicações.','Diga o gasto, eu somo. E guardo para os seus sonhos.'],
 ['Para os filhos: tranquilidade.','Quem cuida está a um toque. Uma subscrição serve para toda a família.']]};
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const pg=await b.newPage({viewport:{width:1320,height:2868},deviceScaleFactor:1});
 const css="@font-face{font-family:L;font-weight:800;src:url(data:font/woff2;base64,"+f64('lexend',800)+")}@font-face{font-family:A;font-weight:700;src:url(data:font/woff2;base64,"+f64('atkinson-hyperlegible-next',700)+")}";
 for(const pais of ['br','pt']) for(let i=0;i<6;i++){ const [f,tela,yy,cor,dy]=CENA[i]; const y0=typeof yy==='object'?yy[pais]:yy; const [h,s]=TX[pais][i];
  const foto=fs.readFileSync(FOT+f+'.jpg').toString('base64'); const sb=y0===0, SB=JSON.parse(fs.readFileSync(RAW+'sb.json')); const scr=fs.readFileSync(RAW+pais+'_'+tela+(sb?'_sb':'')+'.png').toString('base64');
  const ang=[-13,12,-12,13,-12,12][i], PW=780, SW=PW-60, esc=SW/1320;
  await pg.setContent(`<style>${css}*{margin:0;box-sizing:border-box}body{width:1320px;height:2868px;position:relative;overflow:hidden;background:${cor}}
  .ft{position:absolute;left:0;top:${-dy}px;width:1320px;height:auto}
  .g1{position:absolute;inset:0 0 auto 0;height:1000px;background:linear-gradient(rgba(6,10,18,.82),rgba(6,10,18,.55) 45%,rgba(6,10,18,0))}
  .g2{position:absolute;left:0;right:0;top:1350px;height:600px;background:linear-gradient(rgba(0,0,0,0),${cor})}
  .bx{position:absolute;left:0;right:0;top:1950px;bottom:0;background:${cor}}
  .t{position:absolute;left:90px;right:90px;top:140px;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.35)}
  h1{font:800 104px/1.06 L;letter-spacing:-.015em;text-wrap:balance}p{font:700 56px/1.28 A;margin-top:34px;text-wrap:balance;opacity:.96}
  .stg{position:absolute;left:0;right:0;top:1530px;height:1600px;perspective:2400px;filter:drop-shadow(0 60px 70px rgba(0,0,0,.5)) drop-shadow(0 12px 18px rgba(0,0,0,.35))}
  .ph{margin:0 auto;width:${PW}px;height:1660px;border-radius:124px;padding:12px;background:linear-gradient(125deg,#eef0f3,#8d939b 22%,#3a3e44 48%,#7b818a 72%,#e3e6ea);transform:rotateY(${ang}deg) rotateX(9deg) rotateZ(${-ang/5}deg);transform-origin:50% 0;position:relative}
  .ph:before{content:'';position:absolute;${ang<0?'left':'right'}:-7px;top:330px;width:8px;height:150px;border-radius:6px;background:#6d737b}
  .bz{height:100%;border-radius:112px;background:#05070A;padding:18px}
  .sc{width:100%;height:100%;border-radius:94px;overflow:hidden;background:#fff;position:relative}.sc img{position:absolute;left:0;top:${-y0*esc}px;width:${SW}px}
  .di{position:absolute;top:26px;left:50%;transform:translateX(-50%);width:190px;height:56px;border-radius:30px;background:#000;z-index:3}
  .stb{position:absolute;top:30px;left:54px;right:46px;display:flex;justify-content:space-between;align-items:center;z-index:3;color:${sb?SB[pais+'_'+tela]:'#111'};font:700 34px A}.stb svg{height:26px;fill:currentColor}
  .sc:after{content:'';position:absolute;inset:0;background:linear-gradient(${ang<0?115:245}deg,rgba(255,255,255,.22),rgba(255,255,255,0) 38%)}
</style>
  <img class="ft" src="data:image/jpeg;base64,${foto}"><div class="g1"></div><div class="g2"></div><div class="bx"></div>
  <div class="t"><h1>${h}</h1><p>${s}</p></div><div class="stg"><div class="ph"><div class="bz"><div class="sc"><div class="di"></div>${sb?`<div class="stb"><span>9:41</span><span style="display:flex;gap:10px"><svg viewBox="0 0 34 22"><rect x="0" y="14" width="6" height="8" rx="1.5"/><rect x="9" y="10" width="6" height="12" rx="1.5"/><rect x="18" y="5" width="6" height="17" rx="1.5"/><rect x="27" y="0" width="6" height="22" rx="1.5"/></svg><svg viewBox="0 0 50 24"><rect x="1" y="1" width="42" height="22" rx="6" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/><rect x="4" y="4" width="34" height="16" rx="3.5"/><rect x="45" y="8" width="3" height="8" rx="1.5" opacity=".5"/></svg></span></div>`:""}<img src="data:image/png;base64,${scr}"></div></div></div></div>`); await pg.waitForTimeout(250);
  await pg.screenshot({path:OUT+pais+'_'+(i+1)+'.png'}); }
 await b.close(); console.log('ok'); })();
