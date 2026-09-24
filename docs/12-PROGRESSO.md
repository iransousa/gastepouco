# Progresso da implementação

Estado de cada fase de `11-ROADMAP-E-PROMPTS.md`. Atualize ao concluir uma fase.

| Fase | O que é | Estado |
| --- | --- | --- |
| 0 | Monorepo e infraestrutura | ✅ **EXECUTADO** |
| 1 | Design system em código | ✅ **EXECUTADO** |
| 2 | Primeiro uso e acesso | ✅ **EXECUTADO** |
| 3 | Ler nota fiscal | 🟡 **PARCIAL** — tudo implementado e testado; falta validar contra uma nota real do DF |
| 4 | Início, gastos e detalhe da nota | ⬜ PLANEJADO |
| 5 | Preços da região, lista e ofertas | ⬜ PLANEJADO |
| 6 | Jogo: níveis, selos, ranking, compartilhar | ⬜ PLANEJADO |
| 7 | Minha conta, notificações e ajuda | ⬜ PLANEJADO |
| 8 | Polimento, acessibilidade e lançamento | ⬜ PLANEJADO |
| 9 | Módulo Solana | ⬜ PLANEJADO |

## Como conferir o que já existe

```bash
pnpm i
docker compose up -d db redis
pnpm --filter @gastemenos/api db:migrate
pnpm --filter @gastemenos/api db:seed
pnpm dev                      # web :5173, api :3001 (Swagger em /docs)
pnpm lint && pnpm typecheck && pnpm test
pnpm --filter @gastemenos/web test:e2e
```

Abra `http://127.0.0.1:5173/dev/ui` para o design system nos 3 temas e 3 tamanhos de texto.

## Fase 0 — executado

Monorepo pnpm + Turborepo, `apps/web` (React 18 + Vite 6 + Tailwind + Router +
TanStack Query + PWA), `apps/api` (NestJS 10 + Prisma 6 + Postgres 16),
`packages/tokens`, `packages/ui`, `packages/shared`, Docker Compose, ESLint,
Prettier, Vitest, Jest, Playwright e CI no GitHub Actions.

`packages/shared` concentra o que web e API não podem divergir: chave de acesso
de 44 dígitos (modelo 65, DV módulo 11), dinheiro em centavos, geohash de
região com os 8 vizinhos, tabela de pontos e níveis.

O seed confere os próprios números contra as telas de referência e falha se
divergirem: R$ 1.284,60 em setembro, o rateio por categoria, R$ 4.212,90 no
trimestre, R$ 12.940,30 no ano, nível 12 com 460 pontos no nível.

### Decisões de ambiente

- **Postgres em 5435 e API em 3001.** As portas 5432–5434 e 3000 já estavam
  ocupadas na máquina de desenvolvimento.
- **Endereços em `127.0.0.1`, não `localhost`.** No Windows `localhost` resolve
  `::1` primeiro, e nem o Prisma nem o Playwright alcançavam o bind.
- **`consistent-type-imports` desligado em `apps/api`.** O NestJS resolve a
  injeção pelo tipo do parâmetro do construtor em tempo de execução;
  `import type` apaga o símbolo e o app sobe para quebrar na primeira
  requisição.
- **`SMTP_URL` vazio por padrão.** Sem SMTP o código de 6 dígitos vai para o log
  da API, que é o que permite testar o cadastro sem caixa postal.

## Fase 1 — executado

Os 17 componentes de `design-system/bundle-referencia/` portados para TSX em
`packages/ui`, com as props de `index.d.ts`. `AppearanceProvider` escreve
`data-theme`, `data-text-size` e `data-reduce-motion` no `<html>`.

Os componentes recebem o link por contexto em vez de importar o React Router,
para o design system continuar utilizável fora do app.

47 testes de unidade (axe por componente, mais papéis, rótulos e estado) e 27
do Playwright nas três combinações exigidas por `08-ACESSIBILIDADE.md`.

### Dois defeitos de acessibilidade corrigidos no design system

Encontrados pelo axe em navegador de verdade — no jsdom a regra de contraste é
pulada em silêncio, porque não há canvas.

1. **Selo "Patrocinado": 4,42:1**, abaixo do mínimo AA de 4,5:1. Justo no
   elemento que é obrigatório ser legível. A camada escura sobre o laranja
   virou clara: 7,3:1, e o selo continua destacado.
2. **Botão `danger` no tema escuro: 2,07:1.** O CSS fixava `color: #FFFFFF`,
   que funciona no tema claro (`--danger` é vermelho escuro) e quebra no escuro
   (`--danger` vira salmão claro). Criado o token `on-danger`, que inverte com
   o tema.

As duas divergências de `bundle.css` estão comentadas no lugar, com a medição,
para ninguém "restaurar" depois.

## Fase 2 — executado

**API, verificada contra o banco real:**

- `POST /auth/register`, `verify-email`, `resend-code`, `login`, `refresh`,
  `logout`, `forgot-password`, `reset-password`, `GET /auth/sessions`
- `GET /me`, `GET/PUT /me/profile`, `GET /me/preferences`
- Senha com Argon2id; access token de 15 min; refresh rotativo em cookie
  `httpOnly` com detecção de reutilização (revoga a família inteira)
- Rate limit por rota: 5 logins/15 min, 1 reenvio/min, 3 pedidos de senha/15 min
- Persona e orçamento a partir das 5 respostas; 50 pontos ao confirmar o
  e-mail e 100 no perfil, sem crédito duplo

Fluxo conferido ponta a ponta: cadastro → código no log → confirmação →
**150 pontos**, com o segundo envio do perfil dando 0.

**Telas:** as 9 de primeiro uso e acesso, com 57 testes do Playwright passando
nos três temas — incluindo o fluxo inteiro em contraste, letra Muito grande e
320px de largura.

### Decisões das telas

- **Radio e checkbox nativos no perfil de consumo**, não `button` com
  `role="radio"`. Um radiogroup ARIA só está certo se as setas do teclado
  navegarem entre as opções, e isso o navegador já faz de graça com o elemento
  real (docs/08-ACESSIBILIDADE.md, "Elementos reais").
- **Um campo só para o código de 6 dígitos**, não seis caixinhas. Seis campos
  quebram o preenchimento automático do celular, atrapalham o leitor de tela e
  tornam corrigir um dígito um pequeno inferno para quem tem pouca firmeza no
  toque. `autoComplete="one-time-code"` faz o sistema oferecer o código.
- **A tela do Google é do GasteMenos**, não uma imitação da do Google, e diz o
  que o app recebe antes de mandar para lá.
- **O access token vive em memória, nunca em localStorage**, e a sessão volta
  pelo cookie httpOnly ao recarregar. Um 401 dispara uma renovação e repete a
  chamada, com uma renovação por vez — o refresh é rotativo e duas em paralelo
  se queimariam.
- **Ícones `eye`/`eyeOff` acrescentados ao design system**: o protótipo da tela
  Entrar já usava esse desenho, mas ele não vinha no bundle de referência.

### Limites de requisição e a suíte

As rotas de acesso têm limite por IP e os três projetos do Playwright rodam do
mesmo IP. `RATE_LIMIT_TEST_FACTOR` multiplica os limites em desenvolvimento; o
boot **recusa** esse valor em produção. Afrouxar o limite para o teste passar
seria trocar uma proteção real por um check verde.

### Rota de desenvolvimento

`GET /v1/dev/codigo?email=` devolve o código de confirmação, para o teste de
ponta a ponta não precisar raspar log. Três travas, porque uma só fica a uma
linha de um incidente: o módulo só é registrado fora de produção, o controller
confere `NODE_ENV` a cada chamada, e a rota fica fora do Swagger.

### Acrescentado ao schema

`VerificationCode` (+ enum `VerificationKind`) não existia em
`prisma/schema.prisma`, mas `04-API.md` pede código de 6 dígitos e link de
recuperação. Guardado como hash, com `expiresAt`.


## Fase 3 — parcial

**Implementado e testado (34 testes na API):**

- Parser da NFC-e por rótulo visível, não por classe CSS nem posição, com
  caminho de segurança pelo texto corrido da linha
- Adaptador do DF e registro por código IBGE da UF
- Fila BullMQ com 3 tentativas e espera crescente; buscador com 1 requisição
  por segundo por UF, User-Agent identificado e cache de 24 h por chave
- Deduplicação **global** pela chave de acesso
- Casamento de produto por GTIN → alias da loja → descrição normalizada
- Observação de preço com `userHash`, nunca o `userId`
- Economia calculada contra a média aparada da região, respeitando o anonimato
  mínimo de 5 notas e 3 pessoas
- Pontos numa transação com a gravação, com bônus de mercado novo uma vez por
  CNPJ; excluir a nota estorna
- SSE com teto de 30 s, e `GET /receipts`, `DELETE /receipts/:id`
- Telas Escanear (BarcodeDetector com reserva `@zxing/browser`, lanterna,
  galeria, digitar chave, vibração) e NotaLida (ConfettiBurst que respeita
  movimento reduzido), mais fila local em IndexedDB para leitura sem internet

### ⚠️ O que **não** está validado

O critério de aceite da fase diz "ler um QR real do DF registra a nota em menos
de 10 s". **Isso não foi verificado.** Não houve como capturar uma nota real do
DF nem chamar o portal da SEFAZ a partir do ambiente de desenvolvimento.

A fixture em `test/fixtures/nfce/df/nota-sintetica.html` é escrita à mão sobre
a estrutura do modelo padrão da SEFAZ. Os testes provam que o parser é
consistente com essa estrutura; **não** provam que ele lê o portal do DF. Um
parser testado só contra a fixture que o próprio autor escreveu está testando
as suposições do autor.

O que fazer antes de habilitar o DF em produção está em
`test/fixtures/nfce/df/README.md`, incluindo quais capturas valem a pena ter e
o lembrete de remover o CPF do consumidor antes de commitar.

### Decisões

- **Chave inventada à mão é recusada pela validação.** Os testes calculam o
  dígito verificador de verdade — o que custou duas correções e é exatamente o
  comportamento que se quer.
- **`prefers-reduced-motion` indisponível significa não animar.** Nem toda
  webview tem `matchMedia`; sem conseguir perguntar, confete indesejado
  incomoda quem tem sensibilidade a movimento e a falta dele não machuca
  ninguém.
- **Erro de portal volta para a fila; erro de parse não.** Tentar de novo com o
  mesmo HTML dá o mesmo resultado e só gasta visita ao portal.
- **A URL do QR é apagada depois de processar** (docs/09, "Minimização").
- **`eslint-plugin-react-hooks` ativado** no web e no design system.
