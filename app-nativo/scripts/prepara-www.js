// Copia o app web (index.html do repositório) para www/ e injeta a ponte nativa.
const fs=require('fs'), path=require('path');
const raiz=path.join(__dirname,'..','..'), www=path.join(__dirname,'..','www');
fs.rmSync(www,{recursive:true,force:true}); fs.mkdirSync(www,{recursive:true});
let html=fs.readFileSync(path.join(raiz,'index.html'),'utf8');
// no app nativo: sem manifest de PWA; ponte nativa carregada antes do app
// endereço do servidor (Cloudflare Worker) vem de uma variável do GitHub: Settings > Variables > SERVIDOR_URL
const srv=(process.env.SERVIDOR_URL||'').trim().replace(/\/+$/,''), tok=(process.env.APP_TOKEN||'').trim();
const cfg=srv?'<script>window.ESCUDO_CEREBRO_API='+JSON.stringify(srv+'/cerebro')+';window.ESCUDO_VOZ_API='+JSON.stringify(srv+'/fala')+';window.ESCUDO_APP_TOKEN='+JSON.stringify(tok)+';</script>':'';
if(!srv) console.warn('AVISO: SERVIDOR_URL vazio. O app vai funcionar só com o assistente básico (sem IA na nuvem).');
html=html.replace(/<link rel="manifest"[^>]*>/,'').replace('</head>',cfg+'<script src="nativo.js"></script></head>');
fs.writeFileSync(path.join(www,'index.html'),html);
fs.copyFileSync(path.join(__dirname,'..','recursos','nativo.js'),path.join(www,'nativo.js'));
for(const f of ['golpes.json','respostas.json','icone.svg']) if(fs.existsSync(path.join(raiz,f))) fs.copyFileSync(path.join(raiz,f),path.join(www,f));
console.log('www pronto:',fs.readdirSync(www).join(', '));
