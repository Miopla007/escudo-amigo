# Escudo Amigo – teste

Versão de teste do app (2.3): https://miopla007.github.io/escudo-amigo/

- `golpes.json`: catálogo de golpes (atualizado toda semana)
- `respostas.json`: biblioteca de frases dos protetores (atualizada toda semana)
- `servidor/`: servidor gratuito (Cloudflare) para IA, voz e e-mail

## Voz natural (servidor)
O endpoint `/fala` tenta, nesta ordem: ElevenLabs (modelo flash, mais rápido) → Azure Speech (plano gratuito) → Google Text-to-Speech (cota gratuita).
Cada frase gerada fica guardada no cache da Cloudflare, então repetir é instantâneo e não gasta cota.
O app fala frase por frase: começa a primeira enquanto as outras chegam.
