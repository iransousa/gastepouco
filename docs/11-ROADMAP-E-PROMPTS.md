# Roadmap e prompts para o Claude Code

Faça uma fase por vez. Cole o prompt da fase no Claude Code (ou use `/fase <número>`), revise o plano que ele propuser e só siga para a próxima quando os critérios de aceite passarem.

---

## Fase 0 — Monorepo e infraestrutura

**Prompt**
> Leia CLAUDE.md e docs/02-ARQUITETURA.md. Crie o monorepo pnpm + Turborepo com apps/web (React 18 + Vite + TS + Tailwind + React Router + TanStack Query + vite-plugin-pwa), apps/api (NestJS 10 + Prisma + PostgreSQL + BullMQ), packages/tokens, packages/ui e packages/shared. Mova prisma/schema.prisma para apps/api/prisma, crie a primeira migration e o seed descrito em docs/03-MODELO-DE-DADOS.md. Crie docker-compose.yml com Postgres 16 e Redis 7, ESLint + Prettier, Vitest, Jest, Playwright e um workflow de CI (lint, typecheck, test). Não implemente telas ainda.

**Aceite**: `pnpm dev` sobe web e api; `pnpm test`, `pnpm lint` e `pnpm typecheck` passam; seed cria a Camila e as notas de setembro.

---

## Fase 1 — Design system em código

**Prompt**
> Leia design-system/README.md e docs/08-ACESSIBILIDADE.md. Em packages/tokens, crie um script que lê design-system/tokens.json e gera tokens.css e o preset do Tailwind (use design-system/tokens.css e tailwind-preset.ts como saída esperada). Em packages/ui, porte para TSX os 17 componentes de design-system/bundle-referencia, com as mesmas props de index.d.ts, e crie uma página /dev/ui no web que mostra todos os componentes nos 3 temas e 3 tamanhos de texto. Cada componente precisa de teste com vitest-axe. Crie o AppearanceProvider que aplica data-theme, data-text-size e data-reduce-motion no <html>.

**Aceite**: /dev/ui igual às prévias do artifact; zero violações de axe; trocar tema e tamanho muda tudo sem recarregar.

---

## Fase 2 — Primeiro uso e acesso

**Prompt**
> Implemente as telas Onboarding1–3, CriarConta, VerificarEmail, Entrar, GoogleLogin, RecuperarSenha, PerfilConsumo e PerfilPronto seguindo referencia/telas e docs/05-TELAS-E-ROTAS.md, e os endpoints de autenticação e perfil de docs/04-API.md (e-mail/senha com código, Google OAuth com PKCE, refresh rotativo, esqueci a senha). Pontos de boas-vindas e de perfil completo conforme docs/07-GAMIFICACAO.md.

**Aceite**: criar conta, confirmar e-mail, responder as 5 perguntas e cair no Início com 150 pontos; entrar com Google; recuperar senha; teste Playwright do fluxo com axe.

---

## Fase 3 — Ler nota fiscal

**Prompt**
> Leia docs/06-NFCE-LEITURA.md. Implemente o módulo receipts da API (validação da chave com DV, fila BullMQ, adaptador do DF com fixtures, dedupe por chave, criação de Store/Product/PriceObservation, cálculo de economia e pontos, SSE de status) e as telas Escanear (câmera com BarcodeDetector e fallback @zxing/browser, lanterna, galeria, digitar chave, vibração, voz) e NotaLida (comemoração com ConfettiBurst que respeita movimento reduzido). Leituras sem internet vão para uma fila local.

**Aceite**: ler um QR real do DF registra a nota em menos de 10 s; chave inválida mostra a mensagem certa; mesma nota duas vezes dá "Essa nota já foi lida"; subida de nível aparece; testes do adaptador com fixtures.

---

## Fase 4 — Início, gastos e detalhe da nota

**Prompt**
> Implemente Main (Início), MainFacil, Gastos e DetalheNota com os endpoints /spending/* e /receipts. Gráficos (DonutChart, WeeklyBars) em SVG próprio com legenda e resumo em texto para leitor de tela. Excluir nota estorna os pontos.

**Aceite**: números do seed batem com as telas (R$ 1.284,60, categorias, semanas); modo fácil troca o Início; funciona offline com o cache.

---

## Fase 5 — Preços da região, lista e ofertas

**Prompt**
> Implemente o módulo prices (agregação por geohash de 5 caracteres + vizinhos, média aparada, anonimato mínimo de 5 notas e 3 pessoas, job a cada 15 min), as telas Precos, Lista e Ofertas, alertas de preço, sugestão de recompra e o admin de ofertas patrocinadas com selo obrigatório.

**Aceite**: histórico do café igual ao da tela; loja mais barata correta; lista estima R$ 146,72 no seed; oferta patrocinada sempre com selo; região sem dados mostra a mensagem certa.

---

## Fase 6 — Jogo: níveis, selos, ranking e compartilhar

**Prompt**
> Implemente o módulo game conforme docs/07-GAMIFICACAO.md (livro-razão de pontos, níveis e nomes, 9 selos com progresso, sequência semanal, ranking mensal amigos/região × 3 categorias com job, convites) e as telas Ranking, Conquistas e Compartilhar (cartão gerado em canvas e Web Share com arquivo).

**Aceite**: ranking do seed igual à tela; limites anti-abuso testados; cartão de compartilhar gerado em PNG 1080×1920.

---

## Fase 7 — Minha conta, notificações e ajuda

**Prompt**
> Implemente Perfil, DadosPessoais, Seguranca, AlterarSenha, Notificacoes, Privacidade, Acessibilidade, PausarConta, EncerrarConta, CentralNotificacoes e Ajuda, com os endpoints de conta, sessões, preferências, pausa, exclusão agendada (30 dias), exportação de dados, Web Push (VAPID, pedir permissão só após a primeira nota) e horário de silêncio. Siga docs/09-SEGURANCA-LGPD.md.

**Aceite**: pausar tira do ranking e para notificações; encerrar exige ENCERRAR e pode ser desfeito entrando de novo; exportação gera ZIP; trocar e-mail exige código; todas as preferências de acessibilidade persistem entre aparelhos.

---

## Fase 8 — Polimento, acessibilidade e lançamento

**Prompt**
> Rode a auditoria completa de docs/08-ACESSIBILIDADE.md em todas as rotas nas 3 combinações de tema/tamanho/largura, corrija tudo, adicione estados de carregando, vazio, erro e sem conexão em todas as telas, configure o PWA (manifest, ícones do logo, service worker, atualização), observabilidade (Sentry ou similar, logs sem dados pessoais) e o deploy no Coolify.

**Aceite**: Lighthouse PWA e acessibilidade 100; zero violações de axe; deploy em produção com HTTPS.

---

## Fase 9 — Módulo Solana (hackathon, separado)

**Prompt**
> Leia docs/10-MODULO-SOLANA.md. Crie apps/oracle com o programa Anchor PriceFeed, o publisher que lê PriceStat e publica em devnet com Merkle root, a API x402 e o verificador de promoções. Consulte a documentação atual do Anchor, do SDK Solana e do x402 antes de escrever código.

**Aceite**: os critérios de aceite do documento 10.
