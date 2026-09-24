# GasteMenos — pacote para o Claude Code

Tudo o que o Claude Code precisa para construir o GasteMenos: produto, arquitetura, dados, API, telas, design system, regras de leitura da NFC-e, gamificação, acessibilidade, LGPD e o módulo Solana.

## Como usar

1. Crie a pasta do projeto e copie **todo o conteúdo deste pacote** para a raiz (inclusive a pasta oculta `.claude/`).
2. `git init` e abra o Claude Code na pasta: `claude`.
3. Rode `/fase 0` e siga as fases em ordem (`/fase 1`, `/fase 2`...). Cada fase tem prompt e critérios de aceite em `docs/11-ROADMAP-E-PROMPTS.md`.

## Conteúdo

| Caminho | O que é |
| --- | --- |
| `CLAUDE.md` | Instruções permanentes: stack, regras, acessibilidade, definição de pronto |
| `docs/01-PRD.md` | Produto: problema, público, funcionalidades, monetização, métricas |
| `docs/02-ARQUITETURA.md` | Monorepo, web PWA, API NestJS, jobs, região e preços |
| `docs/03-MODELO-DE-DADOS.md` + `prisma/schema.prisma` | Entidades e schema (validado) |
| `docs/04-API.md` | Endpoints REST |
| `docs/05-TELAS-E-ROTAS.md` | As 34 telas: rota, função, API e navegação |
| `docs/06-NFCE-LEITURA.md` | Chave de 44 dígitos, fila, adaptadores por estado, erros |
| `docs/07-GAMIFICACAO.md` | Pontos, níveis, selos, ranking, compartilhar |
| `docs/08-ACESSIBILIDADE.md` | Regras e testes de acessibilidade, modo fácil |
| `docs/09-SEGURANCA-LGPD.md` | Dados pessoais, consentimento, exclusão, segurança |
| `docs/10-MODULO-SOLANA.md` | Oráculo de preços on-chain, x402, verificador de promoções |
| `docs/11-ROADMAP-E-PROMPTS.md` | 10 fases com prompts prontos |
| `design-system/` | Tokens (JSON, CSS, preset Tailwind), componentes de referência, logos |
| `referencia/telas/` | As 34 telas aprovadas do canvas (`.dc.html`) e o `canvas.json` |
| `.claude/commands/fase.md` | Comando `/fase <n>` |

## Decisões tomadas

- PWA React + NestJS + PostgreSQL (escolha sua), com Tailwind e o preset de tokens.
- Módulo Solana como fase separada, sem token para o usuário.
- Leitura da NFC-e pela página pública de consulta de cada estado, começando pelo DF.
- Dados de exemplo fictícios (Camila Alves, Supermercado Vila Nova etc.) só nos seeds.
