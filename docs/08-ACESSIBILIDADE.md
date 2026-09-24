# Acessibilidade

O app é para qualquer pessoa: jovens, idosos, quem nunca usou um app de finanças, quem enxerga mal. Estas regras valem para toda tela e são critério de aceite. Alvo: WCAG 2.2 nível AA.

## Ver

- Texto mínimo de 13px; corpo em 15–16px; números de dinheiro grandes.
- Tamanhos em `rem`. O usuário escolhe em Perfil › Acessibilidade: **Normal** (100%), **Grande** (118,75%), **Muito grande** (137,5%), aplicados em `html[data-text-size]`. O app também segue o tamanho de letra do sistema.
- Nada pode cortar com "Muito grande" a 320px de largura: textos quebram linha, grades viram uma coluna, botões crescem em altura.
- Contraste 4,5:1 para texto e 3:1 para texto de 24px ou mais, bordas de campos e ícones, nos temas **Claro**, **Escuro** e **Alto contraste** (`data-theme="contraste"`: fundo branco ou preto, bordas de 2–3px, sem fundos coloridos claros atrás de texto).
- Significado nunca só pela cor: preço mais caro/mais barato com seta e palavra; interruptor com visto; gráfico com legenda escrita; item marcado na lista com risco e ícone.

## Tocar

- Alvo mínimo de 44×44; botão principal 56px; modo fácil 76px.
- Espaço mínimo de 8px entre alvos vizinhos.
- Nenhum gesto obrigatório (arrastar, pinçar, segurar): toda ação tem um botão.
- A câmera não é o único caminho para ler uma nota: sempre há "Galeria" e "Digitar chave".

## Entender

- Linguagem simples, frases curtas, sem jargão ("pontos", não "XP").
- Um objetivo por tela; ação principal sempre no mesmo lugar (rodapé, largura total).
- Rótulo escrito embaixo de todo ícone da barra inferior, inclusive no botão central "Ler nota".
- Erros dizem o que fazer e ficam junto do campo; nada some sozinho antes de ser lido (toasts: 4 s no mínimo, e nunca com ação obrigatória).
- Ações que apagam dados pedem confirmação escrita (Encerrar conta: digitar ENCERRAR) e oferecem alternativa (Pausar).
- Ajuda sempre a um toque: "Não está conseguindo? Veja como" no leitor e "Precisa de ajuda? Toque aqui" no modo fácil.

## Leitor de tela (TalkBack e VoiceOver)

- HTML semântico: `header`, `main`, `nav`, `section` com títulos em ordem; `button` para ações, `a` para navegação, `input` com `label`.
- Ícones decorativos com `aria-hidden="true"`; botões só de ícone com `aria-label` ("Notificações, 3 novas").
- Estados: `aria-pressed` (chips e segmentos), `role="switch"` + `aria-checked`, `aria-current="page"` (navegação), `aria-expanded` (perguntas da ajuda), `role="progressbar"` com valores, `role="status"` para toasts e para "Nota registrada".
- Gráficos têm resumo em texto (`role="img"` + `aria-label`: "Preço médio caiu de R$ 24,90 em junho para R$ 21,40 em setembro").
- Ao abrir uma tela, o foco vai para o título (`h1` com `tabIndex=-1`); ao fechar um diálogo, volta para quem abriu.

## Ouvir e sentir

- **Ler em voz alta**: `speechSynthesis` com voz pt-BR fala o resultado da nota ("Nota do Supermercado Vila Nova, 187 reais e 40 centavos. Você ganhou 60 pontos."), o resumo do mês e os avisos.
- **Vibrar ao concluir**: `navigator.vibrate(80)` quando a nota é lida (se suportado).

## Movimento

- Respeitar `prefers-reduced-motion` e a opção "Reduzir movimento" (`html[data-reduce-motion="true"]`): sem confete, sem pulsar, sem balançar; transições instantâneas.
- Nada pisca mais de 3 vezes por segundo. Animações em loop (pulsar do botão Ler nota) param depois de alguns ciclos.

## Modo fácil

- Liga em Perfil › Acessibilidade ou na primeira tela de boas-vindas (botão "AA").
- `/inicio` mostra só: quanto gastou, quanto ainda pode gastar, "Ouvir", e três botões grandes (Ler nota fiscal, Minha lista de compras, Onde está mais barato), mais "Precisa de ajuda? Toque aqui".
- Barra inferior com 3 itens (Início, Meus gastos, Ajustes), rótulos de 16px, 96px de altura.
- Ranking, selos e ofertas patrocinadas ficam fora da tela inicial nesse modo.

## Testes obrigatórios

- `vitest-axe` em cada componente de `packages/ui` e em cada rota renderizada.
- Playwright com `@axe-core/playwright` nos fluxos: primeiro uso, ler nota, ver preço, encerrar conta, em 3 combinações: (claro, Normal, 390px), (escuro, Grande, 390px), (contraste, Muito grande, 320px).
- Teste manual antes de cada entrega: navegar a tela inteira só com o teclado e com o leitor de tela do celular.
