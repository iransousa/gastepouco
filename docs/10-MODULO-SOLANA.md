# Módulo Solana (fase separada — hackathon)

Este módulo é **independente do app B2C**: o GasteMenos funciona sem ele. Ele transforma os preços agregados da comunidade num **oráculo de preços e consumo** na Solana e vende acesso aos dados por micropagamento via **x402**.

> Antes de implementar, confira a documentação atual do Anchor, do `@solana/web3.js` (ou `@solana/kit`) e do x402 para Solana: essas bibliotecas mudam rápido. Use o Context7 ou a documentação oficial.

## Objetivos

1. **Oráculo on-chain**: publicar periodicamente, para cada produto × região, a média aparada, mínimo, máximo, número de notas e de pessoas.
2. **Prova de integridade**: cada publicação inclui a raiz de uma Merkle tree das observações usadas (só hashes, nada pessoal), para que qualquer pessoa verifique que um preço fez parte do cálculo.
3. **Dados pagos por uso**: uma API HTTP que responde `402 Payment Required` e libera o dado após pagamento em USDC na Solana (x402).
4. **App consumidor**: um verificador de promoções que lê o oráculo e diz se uma "promoção" está mesmo abaixo da média da região.
5. **Pontos no app**: continuam off-chain no MVP (sem token para o usuário, para evitar taxas e complexidade).

## Estrutura

```
apps/oracle/
├─ programs/price_oracle/    # programa Anchor
├─ publisher/                # serviço Node que lê PriceStat e publica
├─ x402-api/                 # API paga (Express ou Nest) com middleware x402
└─ promo-checker/            # web simples consumidora
```

## Programa (Anchor) — rascunho

- Conta `PriceFeed` (PDA com seeds `["feed", product_key, geohash]`):
  - `product_key: [u8; 32]` (hash do GTIN ou do id do produto)
  - `geohash: [u8; 5]`
  - `avg_cents: u32`, `min_cents: u32`, `max_cents: u32`
  - `receipt_count: u32`, `user_count: u16`
  - `merkle_root: [u8; 32]`
  - `period_start: i64`, `updated_at: i64`
  - `authority: Pubkey`
- Instruções: `init_feed`, `update_feed` (só a `authority` do publisher), `close_feed`.
- Regras: só publicar feeds que cumprem o anonimato mínimo (5 notas, 3 pessoas); nunca incluir identificadores de usuário.

## Publisher

- Job a cada 6 h: lê `PriceStat` do período `day:` mais recente por produto × região com dados suficientes, calcula a Merkle root das `PriceObservation` usadas (folha = hash(produto, loja CNPJ, preço, data, userHash)), envia `update_feed` em lote.
- Guarda no Postgres a assinatura da transação por feed (`oracle_publications`).
- Devnet no hackathon; mainnet só depois de auditoria.

## API x402

- `GET /v1/prices/:productKey?geohash=6vjyg` → sem pagamento responde `402` com os requisitos de pagamento (valor em USDC, rede Solana, destinatário); com o cabeçalho de pagamento válido responde o JSON do feed + a prova Merkle.
- Preços sugeridos para o pitch: R$ 0,01 por consulta de produto; pacotes por região.
- Registre cada consulta paga (sem dados do comprador além da carteira).

## Verificador de promoções

- Página que recebe um produto + preço anunciado + região e mostra: média da região (do oráculo), diferença em %, e o selo "Promoção de verdade" quando o preço está 10% ou mais abaixo da média.
- Pode ser chamado pelo próprio GasteMenos na tela Ofertas (badge "confirmado pelo oráculo").

## Critérios de aceite da fase

- Programa com testes Anchor (init, update pela authority, recusa de update por outra chave).
- Publisher publica em devnet a partir do seed de desenvolvimento.
- API responde 402 sem pagamento e 200 com pagamento válido em devnet.
- Verificador mostra um produto do seed com a prova Merkle verificada no navegador.
