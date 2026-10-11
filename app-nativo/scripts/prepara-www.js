// Copia o app web (index.html do repositório) para www/ e injeta a ponte nativa.
const fs=require('fs'), path=require('path');
const raiz=path.join(__dirname,'..','..'), www=path.join(__dirname,'..','www');
fs.rmSync(www,{recursive:true,force:true}); fs.mkdirSync(www,{recursive:true});
let html=fs.readFileSync(path.join(raiz,'index.html'),'utf8');
// no app nativo: sem manifest de PWA; ponte nativa carregada antes do app
html=html.replace(/<link rel="manifest"[^>]*>/,'').replace('</head>','<script src="nativo.js"></script></head>');
fs.writeFileSync(path.join(www,'index.html'),html);
fs.copyFileSync(path.join(__dirname,'..','recursos','nativo.js'),path.join(www,'nativo.js'));
for(const f of ['golpes.json','respostas.json','icone.svg']) if(fs.existsSync(path.join(raiz,f))) fs.copyFileSync(path.join(raiz,f),path.join(www,f));
console.log('www pronto:',fs.readdirSync(www).join(', '));
