# GasteMenos — documento de produto

## Problema

Quem faz mercado não sabe quanto gasta por mês, nem se pagou caro. Os preços mudam toda semana e variam de uma loja para outra no mesmo bairro. A nota fiscal eletrônica de consumidor (NFC-e) já traz todos os itens e preços, mas ninguém usa esse dado.

## Solução

Um PWA em que a pessoa lê o QR code da nota fiscal e o app:

1. Guarda a compra (loja, data, itens, preços, forma de pagamento).
2. Mostra os gastos do mês, por categoria, por semana e por loja, contra um orçamento.
3. Junta os preços de todas as notas da comunidade para mostrar o histórico de preço de cada produto na região e onde ele está mais barato hoje.
4. Monta a lista de compras a partir do que a pessoa costuma comprar e diz em qual loja ela sai mais barata.
5. Dá pontos a cada nota lida, níveis, selos e um ranking mensal entre amigos e na região.

Quanto mais pessoas leem notas, melhores ficam os preços da região. A gamificação existe para trazer mais leitores e, portanto, mais dados.

## Público

- Pessoas de todas as idades que fazem as compras da casa.
- Inclui idosos e pessoas com pouca experiência em apps ou com a visão cansada: por isso o app tem letra ajustável, alto contraste, modo fácil, leitura em voz alta e textos simples.
- Região inicial: Brasília (DF), bairro Asa Norte nos exemplos.

## Monetização

- **Ofertas patrocinadas** de varejistas parceiros (banner e cards com selo "Patrocinado"), segmentadas por região e perfil de consumo.
- **Promoções enviadas** pelo parceiro para quem compra os produtos dele (com consentimento).
- **Dados agregados e anônimos** de preço e consumo para varejo e indústria (apenas com consentimento, ver LGPD) e, na fase Solana, venda por micropagamento.

## Funcionalidades (MVP)

| Área | O que faz | Telas |
| --- | --- | --- |
| Primeiro uso | 3 telas de boas-vindas, criar conta (e-mail/senha ou Google), confirmar e-mail, 5 perguntas de perfil de consumo, perfil pronto com orçamento sugerido | Onboarding1–3, CriarConta, GoogleLogin, VerificarEmail, PerfilConsumo, PerfilPronto |
| Acesso | Entrar, entrar com Google, recuperar senha | Entrar, GoogleLogin, RecuperarSenha |
| Ler nota | Câmera com leitor de QR, lanterna, importar foto da galeria, digitar a chave de 44 números | Escanear |
| Resultado | Nota registrada, pontos ganhos, subida de nível, selo novo, itens comparados com a média | NotaLida |
| Início | Gasto do mês x orçamento, nível e pontos, atalhos, últimas notas | Main (e MainFacil no modo fácil) |
| Gastos | Total por mês/3 meses/ano, categorias, semanas, destaque do item que mais pesou | Gastos |
| Nota | Detalhe da nota com todos os itens comparados à média, repetir na lista, chave, excluir | DetalheNota |
| Preços | Histórico de 30 dias/6 meses/1 ano, média da região, o que você pagou, lojas mais baratas, alerta | Precos |
| Lista | Lista gerada das últimas compras, marcar itens, sugestão de recompra, loja mais barata | Lista |
| Ofertas | Busca, filtros, banner patrocinado, produtos que baixaram de preço | Ofertas |
| Jogo | Ranking (amigos/região × economia/compras/pontos), conquistas e níveis, compartilhar | Ranking, Conquistas, Compartilhar |
| Notificações | Central de notificações com filtros | CentralNotificacoes |
| Conta | Perfil, dados pessoais, login e segurança, alterar senha, notificações, privacidade, acessibilidade, pausar e encerrar conta | Perfil, DadosPessoais, Seguranca, AlterarSenha, Notificacoes, Privacidade, Acessibilidade, PausarConta, EncerrarConta |
| Ajuda | Perguntas por tema, chat, e-mail, reportar problema | Ajuda |

## Fora do MVP

- Importação automática das notas emitidas no CPF (depende de integração com a Receita/SEFAZ; o campo "CPF na nota" já existe e fica guardado).
- Painel web para parceiros cadastrarem ofertas (no MVP, ofertas são cadastradas por um endpoint administrativo).
- Módulo Solana (fase própria, ver `10-MODULO-SOLANA.md`).
- Apps nativos nas lojas.

## Métricas de sucesso

- Notas lidas por usuário ativo por mês (meta inicial: 4).
- Leituras com sucesso na primeira tentativa (meta: 90%).
- Produtos com preço da região atualizado nos últimos 7 dias.
- Retenção de 4 semanas (sequência de semanas).
- Cliques em ofertas patrocinadas.

## Dados de exemplo

As telas usam dados fictícios: usuária "Camila Alves", mercados "Supermercado Vila Nova", "Atacarejo Planalto", "Mercado Bom Dia", "Padaria Pão Dourado". Use-os nos seeds de desenvolvimento, nunca em produção.
