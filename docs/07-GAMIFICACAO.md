# Pontos, níveis, selos e ranking

Na interface a palavra é sempre **pontos**. No código pode ser `points`.

## Tabela de pontos

| Evento | Pontos | Regra |
| --- | --- | --- |
| Boas-vindas (conta criada e e-mail confirmado) | 50 | uma vez |
| Perfil de consumo completo | 100 | uma vez; responder depois de pular também vale |
| Nota lida | 60 | nota nova, com `pointsEligible`, emitida há no máximo 6 meses |
| Primeira nota em um mercado novo (CNPJ nunca lido por essa pessoa) | +20 | junto com a nota |
| Semana com pelo menos 1 nota (seg–dom, fuso de Brasília) | 40 | creditado no domingo às 23:59 |
| Confirmar o preço de uma oferta ("o preço está certo?") | 10 | até 5 por dia |
| Amigo convidado que lê a primeira nota | 100 | para quem convidou; até 20 por mês |

Limites contra abuso: no máximo 10 notas com pontos por dia por pessoa; notas de valor total abaixo de R$ 2,00 não valem pontos; pontos ficam num livro-razão (`PointsLedger`) e nunca são editados, só estornados com um lançamento negativo.

## Níveis

- Do nível 1 ao 12: 500 pontos por nível.
- Do nível 13 em diante: cada nível pede 100 pontos a mais que o anterior (13 → 600, 14 → 700...).
- Nomes (aparecem no Início, no Perfil e nas Conquistas):

| Níveis | Nome |
| --- | --- |
| 1–3 | Iniciante |
| 4–6 | Pesquisador de Preços |
| 7–11 | Econômico |
| 12 | Caçador de Ofertas |
| 13 | Mestre da Feira |
| 14 | Rei do Atacado |
| 15+ | Lenda da Economia |

Ao subir de nível a resposta da leitura traz `levelUp: { from, to, name }` e o web mostra a tela NotaLida com comemoração.

## Selos

| Selo | Como ganhar |
| --- | --- |
| Primeira nota | ler a primeira nota |
| Carrinho Esperto | 15 notas no mesmo mês |
| Em chamas | 5 semanas seguidas com nota |
| Explorador | notas de 5 mercados diferentes |
| R$ 100 salvos | economia de R$ 100 no mês |
| Caçador de Promoções | comprar 10 produtos que estavam em oferta |
| Detetive de Preços | confirmar 20 preços |
| Embaixador | 3 amigos convidados que leram a primeira nota |
| Lenda do Mês | 1º lugar em qualquer ranking do mês |

Selos em andamento mostram o progresso ("6/10").

## Economia

- Economia de uma nota = soma, por item, de `(média da região − preço pago) × quantidade`, só para itens com preço regional disponível.
- Economia do mês = soma das notas do mês. Pode ser negativa; no ranking conta só o valor positivo.

## Ranking

- Mensal, zera no dia 1. Duas visões: **Amigos** (pessoas conectadas por convite ou código) e **Região** (mesmo geohash de 5 caracteres do CEP da pessoa).
- Três categorias: **Mais economizou** (R$), **Mais compras** (quantidade de notas), **Mais pontos**.
- Mostra top 3 em pódio e a posição da pessoa. Na região, quem desligou "Aparecer no ranking da região" não aparece; quem desligou "Mostrar meu nome" aparece como "Economizador anônimo".
- Contas pausadas não aparecem.

## Compartilhar

A tela Compartilhar gera um cartão (imagem PNG 1080×1920 gerada no navegador com canvas a partir do componente) com valor economizado, posição, nível, 3 selos e o código de convite. Compartilha via Web Share API com arquivo, ou baixa a imagem quando não houver suporte.
