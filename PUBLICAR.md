# Escudo Amigo · Passo a passo para publicar na App Store (versão 1.0)

O que já está pronto no repositório: o app, o projeto do iPhone que é gerado na nuvem, os textos da loja (`loja/app-store.md`), as capturas BR e PT (`loja/prints/`), os termos, a privacidade e o servidor (`servidor/worker.js`).
Algumas partes só podem ser feitas por você, porque pedem a sua conta, a sua senha ou um contrato em seu nome. São estas, na ordem. Tempo total: cerca de 2 horas, mais a espera da Apple.

---

## Parte A · Servidor na Cloudflare (20 min)
Sem ele, a assinatura não entrega nada. A Apple testa a assinatura e rejeita se ela não funcionar.

1. Crie uma conta grátis em **dash.cloudflare.com**.
2. Vá em **Workers & Pages › Create › Create Worker**, dê o nome `escudo-amigo` e toque em **Deploy**.
3. Toque em **Edit code**, apague tudo e cole o conteúdo de `servidor/worker.js` (no GitHub, abra o arquivo e use o botão **Raw**). Toque em **Deploy**.
4. Vá em **Settings › Bindings › Add › Workers AI** e use o nome `AI`.
5. Vá em **Settings › Variables and Secrets** e adicione:
   - `APP_TOKEN`: invente uma senha longa (ex.: 30 letras e números). Guarde-a, porque vai usar a mesma no GitHub.
   - `BRAVE_API_KEY` (recomendado, para a pesquisa na internet): crie em **api-dashboard.search.brave.com**. Há crédito mensal grátis e o uso comercial é permitido.
   - Voz natural ao vivo (escolha **uma** opção):
     - **Azure (recomendado para começar):** crie um recurso "Speech" no plano F0 (grátis, uso comercial permitido) e adicione `AZURE_TTS_KEY` e `AZURE_TTS_REGION`.
     - **ElevenLabs:** só com plano pago, porque o plano grátis não permite uso comercial. Adicione `ELEVENLABS_API_KEY`, `VOZ_BR_F` e `VOZ_PT_F`.
6. Copie o endereço do servidor (ex.: `https://escudo-amigo.SEU-NOME.workers.dev`) e abra-o no navegador. Tem de aparecer "Escudo Amigo".
7. **Custo, sendo sincero:** o plano grátis aguenta o início (100 mil pedidos/dia; a IA tem cota diária grátis). Quando houver assinantes pagando, passe para o **Workers Paid (US$ 5/mês)**, para a IA não parar a meio do dia. Com uns mil usuários ativos, a conta fica entre US$ 17 e 25 por mês.

## Parte B · GitHub (5 min)
No repositório **Miopla007/escudo-amigo**, vá em **Settings › Secrets and variables › Actions**.
- Aba **Variables › New variable:** `SERVIDOR_URL` = o endereço do passo A6.
- Aba **Secrets › New secret:** `APP_TOKEN` = a mesma senha do passo A5.
- Os outros 4 segredos vêm da Parte C: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` e `APPLE_TEAM_ID`.

## Parte C · Apple (60 min)
1. **Contrato de apps pagos.** Em App Store Connect › **Negócios** (Business), aceite o *Paid Apps Agreement* e preencha a conta bancária e os impostos. Sem isso, a assinatura não aparece nem nos testes.
2. **Registar o identificador.** Em developer.apple.com › Certificates, IDs & Profiles › **Identifiers › +** › App IDs › App, use a descrição "Escudo Amigo" e o Bundle ID explícito `com.miopla.escudoamigo`. Não precisa marcar nada a mais.
3. **Criar o app.** Em App Store Connect › **Apps › + › Novo app**: plataforma iOS, nome **Escudo Amigo: contra golpes**, idioma principal **Português (Brasil)**, Bundle ID `com.miopla.escudoamigo`, SKU `escudo-amigo-ios`.
4. **Chave para o GitHub.** Em App Store Connect › **Usuários e acesso › Integrações › API do App Store Connect › Chaves da equipe › +**: nome "GitHub", acesso **Admin**. Baixe o arquivo `.p8`, que só pode ser baixado uma vez.
   - No GitHub, crie os segredos: `ASC_KEY_ID` (o ID da chave), `ASC_ISSUER_ID` (aparece no topo da página) e `ASC_KEY_P8` (abra o .p8 num editor de texto e cole tudo, incluindo as linhas BEGIN/END).
   - `APPLE_TEAM_ID`: em developer.apple.com › Account › **Membership details** › Team ID.
5. **Assinatura.** No app, abra **Monetização › Assinaturas** e siga a secção 2 de `loja/app-store.md`. O ID do produto tem de ser exatamente `com.miopla.escudoamigo.mais.mensal`. O preço é R$ 19,90, com Portugal a 4,99 € e teste grátis de 1 semana.
6. **Gerar o app (build).** No GitHub, abra **Actions › iOS · TestFlight › Run workflow**, escreva **1.0** e toque em **Run**. Leva 20 a 40 minutos. Se ficar vermelho, mande-me o print do erro, que eu corrijo.
7. **TestFlight.** Em 10 a 30 minutos o build aparece em App Store Connect › TestFlight. Adicione-se como testador interno, instale o app **TestFlight** no iPhone e instale o Escudo Amigo.
8. **Teste no iPhone real** (é o que a Apple cobrou no Mortadela):
   - [ ] Apresentação, cadastro e permissões.
   - [ ] Remédio com horário daqui a 2 minutos: feche o app e confira se o alarme toca.
   - [ ] Golpe: cole a mensagem de exemplo.
   - [ ] Ajustes › Escudo Amigo Mais › Assinar. No TestFlight a compra é de teste e não cobra.
   - [ ] Depois de assinar, faça uma pergunta livre, aceite "Pode usar" e veja se responde.
   - [ ] "Já assinei · restaurar".
   - [ ] SOS: o botão pede confirmação antes de ligar.
   - [ ] Troque o país para Portugal em Ajustes e confira os textos e a voz.
9. **Vídeo.** No iPhone, use a Central de Controle › Gravação de Tela e faça o roteiro da nota 1 (secção 5 de `loja/app-store.md`). Suba como "não listado" no YouTube ou como link do Google Drive e cole o link nas notas da revisão.
10. **Página da versão 1.0:**
    - Preencha as duas localizações (PT-BR e PT-PT) com os textos de `loja/app-store.md`.
    - Envie as capturas `br_1…6` e `pt_1…6` no tamanho iPhone 6,9".
    - Em Preços e disponibilidade: app grátis, só Brasil e Portugal.
    - Preencha a Privacidade da app (secção 6) e a classificação etária (secção 1).
    - Escolha o build.
    - Em **Compras dentro do app e assinaturas**, marque a assinatura.
    - **Enviar para revisão.**
11. **Próximas versões:** rode o mesmo botão com **1.1**, depois **1.2**, e assim por diante. O número do build sobe sozinho.

---

## Antes de enviar, com sinceridade
- **Não envie sem o servidor no ar.** É a causa mais provável de rejeição (2.1, app incompleto).
- **Perguntas que a Apple pode fazer:** se o app é "médico" e quem fornece a IA. As notas da secção 5 já respondem. Se pedirem mais, responda pelo Resolution Center em até 1 dia e me mande o texto.
- **Voz gravada:** as falas foram geradas na Higgsfield. Confirme que o seu plano lá permite uso comercial. Os planos pagos normalmente permitem, mas vale ler os termos antes de vender.
- **A família é quem paga.** O argumento de venda mais forte é para os filhos ("o seu pai protegido contra golpes"). Por isso o Compartilhamento Familiar está ligado. Vale fazer o marketing para os filhos, não só para os idosos.
