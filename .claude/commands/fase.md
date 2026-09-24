---
description: Executa uma fase do roadmap do GasteMenos (ex.: /fase 3)
argument-hint: <número da fase>
---

Leia CLAUDE.md e a seção "Fase $ARGUMENTS" de docs/11-ROADMAP-E-PROMPTS.md.

1. Leia todos os documentos e telas de referência citados no prompt da fase.
2. Proponha um plano curto (arquivos a criar/alterar, endpoints, testes) e espere minha aprovação.
3. Implemente em passos pequenos, rodando `pnpm lint`, `pnpm typecheck` e os testes afetados a cada passo.
4. Ao final, confira cada item de "Aceite" da fase e da "Definição de pronto" do CLAUDE.md, e me diga o que passou e o que ficou pendente.
