# Segurança e LGPD

> Este documento orienta a implementação; a política de privacidade e os termos precisam ser revisados por um advogado antes do lançamento.

## Dados pessoais e finalidade

| Dado | Para quê | Onde aparece para outros |
| --- | --- | --- |
| Nome, e-mail, foto | conta | nome no ranking (ou "Economizador anônimo") |
| Celular | verificação em duas etapas | nunca |
| CEP | região de preços e ofertas | nunca (só o geohash de ~5 km é usado) |
| CPF na nota (opcional) | importação futura de notas | nunca; guardado como hash com sal |
| Notas e itens | gastos, lista, pontos | nunca individualmente; preços entram na base sem ligação com a pessoa |
| Perfil de consumo | orçamento sugerido, ordem das ofertas | nunca; parceiros só recebem dados agregados com consentimento |

## Regras

- **Consentimento**: termos e política aceitos no cadastro (versão gravada em `Consent`). Compartilhar com parceiros e ofertas patrocinadas por notificação começam **desligados**.
- **Minimização**: nunca guardar o CPF do consumidor que aparece na nota; nunca guardar a URL completa do QR por mais de 30 dias; HTML bruto da nota guardado só 30 dias para depuração.
- **Anonimato dos preços**: `PriceObservation` usa `userHash` (HMAC do userId com segredo), não o userId. Agregados só são mostrados com 5+ notas de 3+ pessoas.
- **Acesso aos dados**: "Baixar meus dados" gera um ZIP com JSON e CSV (conta, preferências, notas, itens, listas, pontos, selos) em até 24 h; link expira em 7 dias.
- **Exclusão**: "Encerrar conta" marca `PENDING_DELETION` com prazo de 30 dias (a pessoa pode voltar entrando de novo). No prazo, o job apaga a conta e tudo ligado a ela; observações de preço permanecem só com `userHash`, que deixa de poder ser ligado a alguém.
- **Pausa**: some do ranking, notificações param, sequência congela; dados intactos.
- **Transparência**: tela Privacidade e dados explica cada interruptor em linguagem simples; o selo "Patrocinado" é obrigatório em conteúdo pago.

## Segurança

- Senhas com Argon2id; tokens de acesso de 15 min; refresh rotativo com detecção de reutilização (revoga a família).
- Cookies `httpOnly`, `Secure`, `SameSite=Lax`; CORS restrito ao domínio do web; CSP no web.
- Rate limit (Nest Throttler + Redis) em login, cadastro, reenvio de código, leitura de nota (10 com pontos por dia) e busca.
- Verificação em duas etapas opcional por SMS ou e-mail; aviso por e-mail em troca de senha, novo aparelho e pedido de exclusão.
- Google OAuth com PKCE e `state`; ligar conta Google a uma conta existente só com o mesmo e-mail verificado.
- Logs sem dados pessoais (mascarar e-mail, nunca logar tokens, CPF ou HTML de nota).
- Backups diários criptografados do Postgres, com retenção de 30 dias.
